import { describe, test, expect } from 'vitest';
import { getBatchLimit, getHourlyProcessingLimit } from '../../shared/config/subscription.utils';

describe('getBatchLimit', () => {
  describe('Free User Limits', () => {
    test('should return 1 for null subscription tier (free user)', () => {
      const limit = getBatchLimit(null);
      expect(limit).toBe(1);
    });

    test('should return 1 for undefined subscription tier', () => {
      const limit = getBatchLimit(undefined as unknown as string);
      expect(limit).toBe(1);
    });
  });

  describe('Paid Plan Limits', () => {
    test('should return 10 for hobby tier', () => {
      const limit = getBatchLimit('hobby');
      expect(limit).toBe(10);
    });

    test('should return 50 for pro tier', () => {
      const limit = getBatchLimit('pro');
      expect(limit).toBe(50);
    });

    test('should return 500 for business tier', () => {
      const limit = getBatchLimit('business');
      expect(limit).toBe(500);
    });
  });

  describe('Unknown Tier Handling', () => {
    test('should return free limit for unknown tier', () => {
      const limit = getBatchLimit('unknown_tier');
      expect(limit).toBe(1);
    });

    test('should return free limit for empty string tier', () => {
      const limit = getBatchLimit('');
      expect(limit).toBe(1);
    });

    test('should return free limit for random string tier', () => {
      const limit = getBatchLimit('some_random_tier_name');
      expect(limit).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle whitespace in tier name', () => {
      const limit = getBatchLimit('  hobby  ');
      expect(limit).toBe(1); // Should not match trimmed hobby
    });

    test('should handle case sensitivity', () => {
      const limit = getBatchLimit('Hobby');
      expect(limit).toBe(1); // Should not match due to case sensitivity
    });

    test('should handle numeric tier values', () => {
      const limit = getBatchLimit('123' as unknown as string);
      expect(limit).toBe(1);
    });
  });

  // Configuration Integration tests removed as redundant -
  // The tier-specific tests above already verify the correct values from config

  describe('Type Safety', () => {
    test('should handle various input types gracefully', () => {
      // Test with various falsy values
      expect(getBatchLimit(null)).toBe(1);
      expect(getBatchLimit(undefined)).toBe(1);
      expect(getBatchLimit('')).toBe(1);

      // Test with truthy but invalid values
      expect(getBatchLimit('false')).toBe(1);
      expect(getBatchLimit('null')).toBe(1);
      expect(getBatchLimit('undefined')).toBe(1);
    });
  });
});

describe('getHourlyProcessingLimit', () => {
  describe('Free User Limits', () => {
    test('should return 5 for null subscription tier (free user)', () => {
      const limit = getHourlyProcessingLimit(null);
      expect(limit).toBe(5);
    });

    test('should return 5 for undefined subscription tier', () => {
      const limit = getHourlyProcessingLimit(undefined as unknown as string);
      expect(limit).toBe(5);
    });
  });

  describe('Paid Plan Limits', () => {
    test('should return 20 for starter tier', () => {
      expect(getHourlyProcessingLimit('starter')).toBe(20);
    });

    test('should return 40 for hobby tier', () => {
      expect(getHourlyProcessingLimit('hobby')).toBe(40);
    });

    test('should return 200 for pro tier', () => {
      expect(getHourlyProcessingLimit('pro')).toBe(200);
    });

    test('should return 2000 for business tier', () => {
      expect(getHourlyProcessingLimit('business')).toBe(2000);
    });
  });

  describe('Unknown Tier Handling', () => {
    test('should return free limit for unknown tier', () => {
      expect(getHourlyProcessingLimit('unknown_tier')).toBe(5);
    });
  });

  describe('Separation from batchLimit', () => {
    test('hourly limit should be higher than batch limit for free users', () => {
      const batchLimit = getBatchLimit(null);
      const hourlyLimit = getHourlyProcessingLimit(null);
      expect(hourlyLimit).toBeGreaterThan(batchLimit);
    });

    test('hourly limit should be higher than batch limit for all tiers', () => {
      const tiers = ['starter', 'hobby', 'pro', 'business'];
      for (const tier of tiers) {
        const batch = getBatchLimit(tier);
        const hourly = getHourlyProcessingLimit(tier);
        expect(hourly).toBeGreaterThan(batch);
      }
    });
  });
});
