/**
 * Batch limit tracking using in-memory sliding window
 * Follows same pattern as server/rateLimit.ts
 *
 * Note: For multi-instance deployments at scale, consider:
 * - Supabase: Add batch_usage table with user_id, timestamp columns
 * - Cloudflare KV: Store JSON array of timestamps per user
 */

import { getBatchLimit } from '@shared/config/subscription.utils';

// Sliding window duration: 1 hour
const WINDOW_MS = 60 * 60 * 1000;

interface IBatchEntry {
  timestamps: number[];
}

// In-memory storage for batch tracking
const batchStore = new Map<string, IBatchEntry>();

// Cleanup old entries every 5 minutes (same as rateLimit.ts)
setInterval(
  () => {
    const windowStart = Date.now() - WINDOW_MS;

    for (const [key, entry] of batchStore.entries()) {
      entry.timestamps = entry.timestamps.filter(t => t > windowStart);
      if (entry.timestamps.length === 0) {
        batchStore.delete(key);
      }
    }
  },
  5 * 60 * 1000
);

interface IBatchLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  resetAt: Date;
}

export const batchLimitCheck = {
  // Exposed for unit tests (do not use in application code)
  batchStore,

  /**
   * Check if user can process another image within their batch limit
   */
  check(userId: string, tier: string | null): IBatchLimitResult {
    const limit = getBatchLimit(tier);
    const now = Date.now();
    const windowStart = now - WINDOW_MS;

    const entry = batchStore.get(userId);
    const timestamps = entry?.timestamps.filter(t => t > windowStart) ?? [];
    const current = timestamps.length;

    // Calculate reset time (when oldest entry expires)
    const resetAt =
      timestamps.length > 0 ? new Date(timestamps[0] + WINDOW_MS) : new Date(now + WINDOW_MS);

    // Persist cleaned timestamps; delete empty entries to avoid leaks
    if (timestamps.length === 0) {
      batchStore.delete(userId);
    } else if (entry) {
      entry.timestamps = timestamps;
    } else {
      batchStore.set(userId, { timestamps });
    }

    return {
      allowed: current < limit,
      current,
      limit,
      resetAt,
    };
  },

  /**
   * Increment the batch counter after successful processing
   */
  increment(userId: string): void {
    let entry = batchStore.get(userId);
    if (!entry) {
      entry = { timestamps: [] };
      batchStore.set(userId, entry);
    }
    entry.timestamps.push(Date.now());
  },

  /**
   * Get current usage for a user (for potential API endpoint)
   */
  getUsage(
    userId: string,
    tier: string | null
  ): {
    current: number;
    limit: number;
    remaining: number;
  } {
    const limit = getBatchLimit(tier);
    const windowStart = Date.now() - WINDOW_MS;

    const entry = batchStore.get(userId);
    const timestamps = entry?.timestamps.filter(t => t > windowStart) ?? [];

    // Persist cleaned timestamps; delete empty entries to avoid leaks
    if (timestamps.length === 0) {
      batchStore.delete(userId);
    } else if (entry) {
      entry.timestamps = timestamps;
    } else {
      batchStore.set(userId, { timestamps });
    }

    return {
      current: timestamps.length,
      limit,
      remaining: Math.max(0, limit - timestamps.length),
    };
  },
};
