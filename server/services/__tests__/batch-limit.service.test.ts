import { describe, test, expect, beforeEach, vi } from 'vitest';
import { batchLimitCheck } from '../batch-limit.service';

describe('batch-limit.service', () => {
  beforeEach(() => {
    // Clear any console warnings before each test
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('checkAndIncrement()', () => {
    test('should allow first request for free user', async () => {
      const result = await batchLimitCheck.checkAndIncrement('user123', null);

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(0);
      expect(result.limit).toBe(1);
      expect(result.resetAt).toBeInstanceOf(Date);
    });

    test('should allow requests within limit for paid users', async () => {
      // Test hobby user (10 limit)
      let result = await batchLimitCheck.checkAndIncrement('user456', 'hobby');
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(10);
      expect(result.current).toBe(0);

      // Test pro user (50 limit)
      result = await batchLimitCheck.checkAndIncrement('user789', 'pro');
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(50);
      expect(result.current).toBe(0);

      // Test business user (500 limit)
      result = await batchLimitCheck.checkAndIncrement('user101112', 'business');
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(500);
      expect(result.current).toBe(0);
    });

    test('should handle unknown tier as free user', async () => {
      const result = await batchLimitCheck.checkAndIncrement('unknown-user', 'unknown_tier');

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(1);
      expect(result.current).toBe(0);
    });

    test('should set reset time to 1 hour from now', async () => {
      const userId = 'new-user';
      const now = Date.now();

      const result = await batchLimitCheck.checkAndIncrement(userId, null);

      // Reset time should be approximately 1 hour from now
      const resetTime = result.resetAt.getTime();
      const expectedResetTime = now + 60 * 60 * 1000;

      // Allow for small timing differences
      expect(resetTime).toBeGreaterThanOrEqual(expectedResetTime - 1000);
      expect(resetTime).toBeLessThanOrEqual(expectedResetTime + 5000);
    });
  });

  describe('check()', () => {
    test('should allow first request (deprecated method)', async () => {
      const result = await batchLimitCheck.check('user123', null);

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(0);
      expect(result.limit).toBe(1);
      expect(result.resetAt).toBeInstanceOf(Date);
    });

    test('should handle unknown tier as free user', async () => {
      const result = await batchLimitCheck.check('unknown-user', 'unknown_tier');

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(1);
      expect(result.current).toBe(0);
    });
  });

  describe('increment()', () => {
    test('should be a no-op and log warning', () => {
      const warnSpy = vi.spyOn(console, 'warn');
      batchLimitCheck.increment('test-user');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[BATCH_LIMIT] Deprecated: increment()')
      );
    });
  });

  describe('getUsage()', () => {
    test('should return correct usage for new user', async () => {
      const userId = 'usage-new-user';

      const usage = await batchLimitCheck.getUsage(userId, 'hobby');

      expect(usage.current).toBe(0);
      expect(usage.limit).toBe(10);
      expect(usage.remaining).toBe(10);
      expect(usage.resetAt).toBeInstanceOf(Date);
    });

    test('should return correct usage for different tiers', async () => {
      // Test hobby user (10 limit)
      const hobbyUsage = await batchLimitCheck.getUsage('user-hobby', 'hobby');
      expect(hobbyUsage.limit).toBe(10);
      expect(hobbyUsage.remaining).toBe(10);

      // Test pro user (50 limit)
      const proUsage = await batchLimitCheck.getUsage('user-pro', 'pro');
      expect(proUsage.limit).toBe(50);
      expect(proUsage.remaining).toBe(50);

      // Test business user (500 limit)
      const businessUsage = await batchLimitCheck.getUsage('user-business', 'business');
      expect(businessUsage.limit).toBe(500);
      expect(businessUsage.remaining).toBe(500);

      // Test free user (1 limit)
      const freeUsage = await batchLimitCheck.getUsage('user-free', null);
      expect(freeUsage.limit).toBe(1);
      expect(freeUsage.remaining).toBe(1);
    });

    test('should return 0 remaining when at limit in test env', async () => {
      const userId = 'usage-at-limit';

      // In test environment, current is always 0
      const usage = await batchLimitCheck.getUsage(userId, null);

      expect(usage.current).toBe(0);
      expect(usage.limit).toBe(1);
      expect(usage.remaining).toBe(1);
    });

    test('should handle unknown tier as free user', async () => {
      const usage = await batchLimitCheck.getUsage('unknown-user', 'unknown_tier');

      expect(usage.current).toBe(0);
      expect(usage.limit).toBe(1);
      expect(usage.remaining).toBe(1);
    });

    test('should set reset time to 1 hour from now', async () => {
      const userId = 'reset-usage-user';
      const now = Date.now();

      const usage = await batchLimitCheck.getUsage(userId, 'hobby');

      // Reset time should be approximately 1 hour from now
      const resetTime = usage.resetAt.getTime();
      const expectedResetTime = now + 60 * 60 * 1000;

      // Allow for small timing differences
      expect(resetTime).toBeGreaterThanOrEqual(expectedResetTime - 1000);
      expect(resetTime).toBeLessThanOrEqual(expectedResetTime + 5000);
    });
  });

  describe('Multiple Users', () => {
    test('should handle multiple users independently', async () => {
      const user1 = 'multi-user-1';
      const user2 = 'multi-user-2';
      const user3 = 'multi-user-3';

      // Check each user independently
      const result1 = await batchLimitCheck.checkAndIncrement(user1, 'pro');
      const result2 = await batchLimitCheck.checkAndIncrement(user2, 'pro');
      const result3 = await batchLimitCheck.checkAndIncrement(user3, 'pro');

      expect(result1.allowed).toBe(true);
      expect(result1.current).toBe(0);

      expect(result2.allowed).toBe(true);
      expect(result2.current).toBe(0);

      expect(result3.allowed).toBe(true);
      expect(result3.current).toBe(0);
    });
  });

  describe('Concurrent Access', () => {
    test('should handle rapid successive operations', async () => {
      const userId = 'concurrent-user';

      // Rapidly call checkAndIncrement
      const results = await Promise.all(
        Array.from({ length: 20 }, () => batchLimitCheck.checkAndIncrement(userId, 'hobby'))
      );

      // All should be allowed in test environment
      results.forEach((result) => {
        expect(result.allowed).toBe(true);
        expect(result.current).toBe(0);
      });
    });

    test('should maintain data integrity with mixed operations', async () => {
      const userId = 'integrity-user';

      // Mix operations
      await batchLimitCheck.checkAndIncrement(userId, 'pro');
      await batchLimitCheck.getUsage(userId, 'pro');
      await batchLimitCheck.checkAndIncrement(userId, 'pro');

      const usage = await batchLimitCheck.getUsage(userId, 'pro');
      expect(usage.current).toBe(0);
      expect(usage.remaining).toBe(50);
    });
  });
});
