import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { batchLimitCheck } from '../batch-limit.service';

interface IBatchEntry {
  timestamps: number[];
}

interface IBatchStore extends Map<string, IBatchEntry> {
  clear(): void;
  has(key: string): boolean;
  get(key: string): IBatchEntry | undefined;
  set(key: string, value: IBatchEntry): this;
}

describe('batch-limit.service', () => {
  beforeEach(() => {
    // Clear the in-memory store before each test
    (batchLimitCheck as unknown as { batchStore?: IBatchStore }).batchStore?.clear();
  });

  afterEach(() => {
    // Clear any timers and store after each test
    (batchLimitCheck as unknown as { batchStore?: IBatchStore }).batchStore?.clear();
  });

  describe('check()', () => {
    test('should allow first request for free user', () => {
      const result = batchLimitCheck.check('user123', null);

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(0);
      expect(result.limit).toBe(1);
      expect(result.resetAt).toBeInstanceOf(Date);
    });

    test('should allow requests within limit for paid users', () => {
      // Test hobby user (10 limit)
      let result = batchLimitCheck.check('user456', 'hobby');
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(10);
      expect(result.current).toBe(0);

      // Test pro user (50 limit)
      result = batchLimitCheck.check('user789', 'pro');
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(50);
      expect(result.current).toBe(0);

      // Test business user (500 limit)
      result = batchLimitCheck.check('user101112', 'business');
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(500);
      expect(result.current).toBe(0);
    });

    test('should reject when at limit', () => {
      const userId = 'limit-user';

      // Add entries up to free user limit (1)
      batchLimitCheck.increment(userId);

      const result = batchLimitCheck.check(userId, null);
      expect(result.allowed).toBe(false);
      expect(result.current).toBe(1);
      expect(result.limit).toBe(1);
    });

    test('should allow when under limit', () => {
      const userId = 'under-limit-user';

      // Add some entries but stay under hobby limit (10)
      for (let i = 0; i < 5; i++) {
        batchLimitCheck.increment(userId);
      }

      const result = batchLimitCheck.check(userId, 'hobby');
      expect(result.allowed).toBe(true);
      expect(result.current).toBe(5);
      expect(result.limit).toBe(10);
    });

    test('should handle unknown tier as free user', () => {
      const result = batchLimitCheck.check('unknown-user', 'unknown_tier');

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(1);
      expect(result.current).toBe(0);
    });

    test('should calculate reset time correctly', () => {
      const userId = 'reset-user';
      const now = Date.now();

      // Add an entry
      batchLimitCheck.increment(userId);

      const result = batchLimitCheck.check(userId, null);

      // Reset time should be approximately 1 hour from the first entry
      const resetTime = result.resetAt.getTime();
      const expectedResetTime = now + 60 * 60 * 1000;

      // Allow for small timing differences
      expect(resetTime).toBeGreaterThanOrEqual(expectedResetTime - 1000);
      expect(resetTime).toBeLessThanOrEqual(expectedResetTime + 1000);
    });

    test('should set reset time to 1 hour from now for new users', () => {
      const userId = 'new-user';
      const now = Date.now();

      const result = batchLimitCheck.check(userId, null);

      // For new users with no entries, reset time should be 1 hour from now
      const resetTime = result.resetAt.getTime();
      const expectedResetTime = now + 60 * 60 * 1000;

      expect(resetTime).toBeGreaterThanOrEqual(expectedResetTime - 1000);
      expect(resetTime).toBeLessThanOrEqual(expectedResetTime + 1000);
    });
  });

  describe('increment()', () => {
    test('should add timestamp for new user', () => {
      const userId = 'new-increment-user';
      const before = Date.now();

      batchLimitCheck.increment(userId);

      const result = batchLimitCheck.check(userId, null);
      expect(result.current).toBe(1);

      // Verify timestamp is recent
      const entry = (batchLimitCheck as unknown as { batchStore: IBatchStore }).batchStore.get(
        userId
      );
      expect(entry.timestamps).toHaveLength(1);
      expect(entry.timestamps[0]).toBeGreaterThanOrEqual(before);
      expect(entry.timestamps[0]).toBeLessThanOrEqual(Date.now());
    });

    test('should add timestamp for existing user', () => {
      const userId = 'existing-user';

      // Add first entry
      batchLimitCheck.increment(userId);
      let result = batchLimitCheck.check(userId, null);
      expect(result.current).toBe(1);

      // Add second entry
      batchLimitCheck.increment(userId);
      result = batchLimitCheck.check(userId, null);
      expect(result.current).toBe(2);
    });

    test('should create entry if missing on increment', () => {
      const userId = 'create-on-increment';

      // Directly check that entry doesn't exist
      const store = (batchLimitCheck as unknown as { batchStore: IBatchStore }).batchStore;
      expect(store.has(userId)).toBe(false);

      // Increment should create the entry
      batchLimitCheck.increment(userId);
      expect(store.has(userId)).toBe(true);

      const entry = store.get(userId);
      expect(entry.timestamps).toHaveLength(1);
    });
  });

  describe('getUsage()', () => {
    test('should return correct usage for new user', () => {
      const userId = 'usage-new-user';

      const usage = batchLimitCheck.getUsage(userId, 'hobby');

      expect(usage.current).toBe(0);
      expect(usage.limit).toBe(10);
      expect(usage.remaining).toBe(10);
    });

    test('should return correct usage for user with entries', () => {
      const userId = 'usage-existing-user';

      // Add some entries
      for (let i = 0; i < 3; i++) {
        batchLimitCheck.increment(userId);
      }

      const usage = batchLimitCheck.getUsage(userId, 'pro');

      expect(usage.current).toBe(3);
      expect(usage.limit).toBe(50);
      expect(usage.remaining).toBe(47);
    });

    test('should return 0 remaining when at limit', () => {
      const userId = 'usage-at-limit';

      // Fill up free user limit
      batchLimitCheck.increment(userId);

      const usage = batchLimitCheck.getUsage(userId, null);

      expect(usage.current).toBe(1);
      expect(usage.limit).toBe(1);
      expect(usage.remaining).toBe(0);
    });

    test('should never return negative remaining', () => {
      const userId = 'usage-over-limit';

      // Add more entries than limit (hobby limit is 10)
      for (let i = 0; i < 15; i++) {
        batchLimitCheck.increment(userId);
      }

      const usage = batchLimitCheck.getUsage(userId, 'hobby');

      expect(usage.remaining).toBe(0);
      expect(usage.remaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Sliding Window Behavior', () => {
    test('should expire old entries outside window', async () => {
      const userId = 'window-user';
      const now = Date.now();

      // Add an old entry (2 hours ago)
      const oldTimestamp = now - 2 * 60 * 60 * 1000;
      const store = (batchLimitCheck as unknown as { batchStore: IBatchStore }).batchStore;
      store.set(userId, {
        timestamps: [oldTimestamp],
      });

      // Check should show no current entries
      const result = batchLimitCheck.check(userId, 'hobby');
      expect(result.current).toBe(0);
      expect(result.allowed).toBe(true);
    });

    test('should keep recent entries within window', async () => {
      const userId = 'window-recent-user';
      const now = Date.now();

      // Add a recent entry (30 minutes ago)
      const recentTimestamp = now - 30 * 60 * 1000;
      const store = (batchLimitCheck as unknown as { batchStore: IBatchStore }).batchStore;
      store.set(userId, {
        timestamps: [recentTimestamp],
      });

      // Check should show the recent entry
      const result = batchLimitCheck.check(userId, 'hobby');
      expect(result.current).toBe(1);
    });

    test('should handle mixed old and new timestamps', async () => {
      const userId = 'window-mixed-user';
      const now = Date.now();

      // Add mix of old and recent entries
      const oldTimestamp = now - 2 * 60 * 60 * 1000; // 2 hours ago
      const recentTimestamp = now - 30 * 60 * 1000; // 30 minutes ago

      const store = (batchLimitCheck as unknown as { batchStore: IBatchStore }).batchStore;
      store.set(userId, {
        timestamps: [oldTimestamp, recentTimestamp],
      });

      // Check should only count the recent entry
      const result = batchLimitCheck.check(userId, 'hobby');
      expect(result.current).toBe(1);

      // Store should have cleaned up the old entry
      const entry = store.get(userId);
      expect(entry.timestamps).toHaveLength(1);
      expect(entry.timestamps[0]).toBe(recentTimestamp);
    });
  });

  describe('Multiple Users', () => {
    test('should handle multiple users independently', () => {
      const user1 = 'multi-user-1';
      const user2 = 'multi-user-2';
      const user3 = 'multi-user-3';

      // Add different amounts for each user
      batchLimitCheck.increment(user1);
      for (let i = 0; i < 5; i++) {
        batchLimitCheck.increment(user2);
      }
      for (let i = 0; i < 15; i++) {
        batchLimitCheck.increment(user3);
      }

      // Check each user has correct count
      const result1 = batchLimitCheck.check(user1, 'pro');
      const result2 = batchLimitCheck.check(user2, 'pro');
      const result3 = batchLimitCheck.check(user3, 'pro');

      expect(result1.current).toBe(1);
      expect(result1.allowed).toBe(true);

      expect(result2.current).toBe(5);
      expect(result2.allowed).toBe(true);

      expect(result3.current).toBe(15);
      expect(result3.allowed).toBe(true);
    });

    test('should not affect other users when one is at limit', () => {
      const limitedUser = 'limited-user';
      const normalUser = 'normal-user';

      // Fill up free user limit for limitedUser
      batchLimitCheck.increment(limitedUser);

      // Check limited user is blocked
      const limitedResult = batchLimitCheck.check(limitedUser, null);
      expect(limitedResult.allowed).toBe(false);

      // Check normal user is still allowed
      const normalResult = batchLimitCheck.check(normalUser, null);
      expect(normalResult.allowed).toBe(true);
    });
  });

  describe('Concurrent Access', () => {
    test('should handle rapid successive operations', () => {
      const userId = 'concurrent-user';

      // Rapidly add entries
      for (let i = 0; i < 20; i++) {
        batchLimitCheck.increment(userId);
      }

      const result = batchLimitCheck.check(userId, 'hobby');
      expect(result.current).toBe(20);
      expect(result.allowed).toBe(false); // Should be over hobby limit of 10
    });

    test('should maintain data integrity with mixed operations', () => {
      const userId = 'integrity-user';

      // Mix operations
      batchLimitCheck.increment(userId);
      batchLimitCheck.check(userId, 'pro');
      batchLimitCheck.increment(userId);
      batchLimitCheck.getUsage(userId, 'pro');
      batchLimitCheck.increment(userId);

      const result = batchLimitCheck.check(userId, 'pro');
      expect(result.current).toBe(3);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Data Store Management', () => {
    test('should clean up empty entries during check', () => {
      const userId = 'cleanup-user';
      const store = (batchLimitCheck as unknown as { batchStore: IBatchStore }).batchStore;

      // Add an old entry that will be cleaned up
      const oldTimestamp = Date.now() - 2 * 60 * 60 * 1000;
      store.set(userId, {
        timestamps: [oldTimestamp],
      });

      expect(store.has(userId)).toBe(true);

      // Check should clean up the empty entry
      batchLimitCheck.check(userId, 'hobby');

      expect(store.has(userId)).toBe(false);
    });

    test('should handle missing entries gracefully', () => {
      const userId = 'missing-user';
      const store = (batchLimitCheck as unknown as { batchStore: IBatchStore }).batchStore;

      expect(store.has(userId)).toBe(false);

      // All operations should work with missing entries
      const checkResult = batchLimitCheck.check(userId, null);
      const usageResult = batchLimitCheck.getUsage(userId, null);

      expect(checkResult.allowed).toBe(true);
      expect(checkResult.current).toBe(0);
      expect(usageResult.current).toBe(0);
      expect(usageResult.remaining).toBe(1);
    });
  });
});
