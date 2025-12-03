import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, publicRateLimit } from '@server/rateLimit';
import { serverEnv } from '@shared/config/env';

/**
 * Rate limit configuration
 */
const PUBLIC_RATE_LIMIT = 10;
const USER_RATE_LIMIT = 50;

/**
 * Get the client IP address from the request, prioritizing Cloudflare headers
 */
export function getClientIp(req: NextRequest): string {
  // Cloudflare-specific header (most reliable on Cloudflare)
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;

  // Standard forwarded header
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  // Alternative header
  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp) return xRealIp;

  return 'unknown';
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(
  limit: number,
  remaining: number,
  reset: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': new Date(reset).toISOString(),
    'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
  };
}

/**
 * Check if rate limiting should be skipped (test environment)
 * Uses dedicated ENV variable for clarity and security
 */
export function isTestEnvironment(): boolean {
  return serverEnv.ENV === 'test';
}

/**
 * Apply public (IP-based) rate limiting
 * Returns null if the request should proceed, or a response if rate limited
 */
export async function applyPublicRateLimit(
  req: NextRequest,
  res: NextResponse
): Promise<NextResponse | null> {
  // Skip rate limiting in test environment
  if (isTestEnvironment()) {
    return null;
  }

  const ip = getClientIp(req);
  const { success, remaining, reset } = await publicRateLimit.limit(ip);
  const rateLimitHeaders = createRateLimitHeaders(PUBLIC_RATE_LIMIT, remaining, reset);

  if (!success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.',
          details: {
            retryAfter: Math.ceil((reset - Date.now()) / 1000),
          },
        },
      },
      {
        status: 429,
        headers: rateLimitHeaders,
      }
    );
  }

  // Add rate limit headers to successful responses
  Object.entries(rateLimitHeaders).forEach(([key, value]) => {
    if (key !== 'Retry-After') {
      res.headers.set(key, value);
    }
  });

  return null;
}

/**
 * Apply user-based rate limiting
 * Returns null if the request should proceed, or a response if rate limited
 */
export async function applyUserRateLimit(
  userId: string,
  res: NextResponse
): Promise<NextResponse | null> {
  const { success, remaining, reset } = await rateLimit.limit(userId);
  const rateLimitHeaders = createRateLimitHeaders(USER_RATE_LIMIT, remaining, reset);

  if (!success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Rate limit exceeded. Please try again later.',
          details: {
            retryAfter: Math.ceil((reset - Date.now()) / 1000),
          },
        },
      },
      {
        status: 429,
        headers: rateLimitHeaders,
      }
    );
  }

  // Add rate limit headers to successful responses
  Object.entries(rateLimitHeaders).forEach(([key, value]) => {
    if (key !== 'Retry-After') {
      res.headers.set(key, value);
    }
  });

  return null;
}
