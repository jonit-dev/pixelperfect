import { describe, test, expect } from 'vitest';
import { calculateBalanceWithExpiration } from '../../shared/config/subscription.utils';
import { CREDIT_COSTS } from '../../shared/config/credits.config';

describe('Credit Rollover Edge Cases', () => {
  describe('6x Cap Scenarios', () => {
    test('should handle exact cap limit scenarios for all tiers', () => {
      const scenarios = [
        {
          name: 'Starter at exact 6x cap',
          currentBalance: 600, // 100 * 6
          newCredits: 100,
          maxRollover: 600,
          expected: 600,
        },
        {
          name: 'Hobby at exact 6x cap',
          currentBalance: 1200, // 200 * 6
          newCredits: 200,
          maxRollover: 1200,
          expected: 1200,
        },
        {
          name: 'Pro at exact 6x cap',
          currentBalance: 6000, // 1000 * 6
          newCredits: 1000,
          maxRollover: 6000,
          expected: 6000,
        },
        {
          name: 'Business at exact 6x cap',
          currentBalance: 30000, // 5000 * 6
          newCredits: 5000,
          maxRollover: 30000,
          expected: 30000,
        },
      ];

      scenarios.forEach(({ name, currentBalance, newCredits, maxRollover, expected }) => {
        const result = calculateBalanceWithExpiration({
          currentBalance,
          newCredits,
          expirationMode: 'never',
          maxRollover,
        });

        expect(result.newBalance).toBe(expected);
        expect(result.expiredAmount).toBe(0);
      });
    });

    test('should handle balance just under 6x cap', () => {
      const scenarios = [
        {
          name: 'Starter: 599 credits (1 under cap)',
          currentBalance: 599,
          newCredits: 100,
          maxRollover: 600,
          expected: 600, // Capped
        },
        {
          name: 'Hobby: 1199 credits (1 under cap)',
          currentBalance: 1199,
          newCredits: 200,
          maxRollover: 1200,
          expected: 1200, // Capped
        },
        {
          name: 'Pro: 5999 credits (1 under cap)',
          currentBalance: 5999,
          newCredits: 1000,
          maxRollover: 6000,
          expected: 6000, // Capped
        },
      ];

      scenarios.forEach(({ name, currentBalance, newCredits, maxRollover, expected }) => {
        const result = calculateBalanceWithExpiration({
          currentBalance,
          newCredits,
          expirationMode: 'never',
          maxRollover,
        });

        expect(result.newBalance).toBe(expected);
        expect(result.expiredAmount).toBe(0);
      });
    });

    test('should handle massive overage scenarios', () => {
      const scenarios = [
        {
          name: 'Starter: 10x over cap',
          currentBalance: 6000, // 10x the cap
          newCredits: 100,
          maxRollover: 600,
          expected: 600, // Capped
        },
        {
          name: 'Hobby: 50x over cap',
          currentBalance: 60000, // 50x the cap
          newCredits: 200,
          maxRollover: 1200,
          expected: 1200, // Capped
        },
      ];

      scenarios.forEach(({ name, currentBalance, newCredits, maxRollover, expected }) => {
        const result = calculateBalanceWithExpiration({
          currentBalance,
          newCredits,
          expirationMode: 'never',
          maxRollover,
        });

        expect(result.newBalance).toBe(expected);
        expect(result.expiredAmount).toBe(0);
      });
    });
  });

  describe('Downgrade Preservation Tests', () => {
    test('should preserve credits up to new cap on downgrade', () => {
      const downgradeScenarios = [
        {
          from: 'Pro',
          to: 'Hobby',
          fromBalance: 3000,
          toCap: 1200,
          newCredits: 200,
          expected: 1200, // Capped at Hobby level
        },
        {
          from: 'Business',
          to: 'Pro',
          fromBalance: 10000,
          toCap: 6000,
          newCredits: 1000,
          expected: 6000, // Capped at Pro level
        },
        {
          from: 'Business',
          to: 'Starter',
          fromBalance: 20000,
          toCap: 600,
          newCredits: 100,
          expected: 600, // Capped at Starter level
        },
      ];

      downgradeScenarios.forEach(({ from, to, fromBalance, toCap, newCredits, expected }) => {
        const result = calculateBalanceWithExpiration({
          currentBalance: fromBalance,
          newCredits,
          expirationMode: 'never',
          maxRollover: toCap,
        });

        expect(result.newBalance).toBe(expected);
        expect(result.expiredAmount).toBe(0);
      });
    });

    test('should not lose credits when downgrading from higher balance', () => {
      // User has 800 credits (exceeds Starter cap but within Hobby cap)
      // Downgrades from Hobby to Starter
      const result = calculateBalanceWithExpiration({
        currentBalance: 800,
        newCredits: 100, // Starter monthly allocation
        expirationMode: 'never',
        maxRollover: 600, // Starter cap
      });

      expect(result.newBalance).toBe(600); // Preserved up to Starter cap
      expect(result.expiredAmount).toBe(0);
    });

    test('should handle multiple downgrades in sequence', () => {
      let balance = 5000; // Starting with Pro-like balance

      // First downgrade: Pro -> Hobby
      balance = calculateBalanceWithExpiration({
        currentBalance: balance,
        newCredits: 0, // No new credits
        expirationMode: 'never',
        maxRollover: 1200, // Hobby cap
      }).newBalance;
      expect(balance).toBe(1200);

      // Second downgrade: Hobby -> Starter
      balance = calculateBalanceWithExpiration({
        currentBalance: balance,
        newCredits: 0, // No new credits
        expirationMode: 'never',
        maxRollover: 600, // Starter cap
      }).newBalance;
      expect(balance).toBe(600);
    });
  });

  describe('Credit Pool Mixing Scenarios', () => {
    test('should handle mixed subscription and purchased credits', () => {
      const scenarios = [
        {
          name: 'Mixed pools under cap',
          subscriptionCredits: 300,
          purchasedCredits: 200,
          newCredits: 100,
          cap: 600,
          expected: 600, // 300 + 200 + 100 = 600 (at cap)
        },
        {
          name: 'Mixed pools over cap',
          subscriptionCredits: 400,
          purchasedCredits: 300,
          newCredits: 100,
          cap: 600,
          expected: 600, // Capped despite having 800 total
        },
        {
          name: 'Only purchased credits over cap',
          subscriptionCredits: 0,
          purchasedCredits: 800,
          newCredits: 100,
          cap: 600,
          expected: 600, // Capped
        },
      ];

      scenarios.forEach(
        ({ name, subscriptionCredits, purchasedCredits, newCredits, cap, expected }) => {
          const totalBalance = subscriptionCredits + purchasedCredits;
          const result = calculateBalanceWithExpiration({
            currentBalance: totalBalance,
            newCredits,
            expirationMode: 'never',
            maxRollover: cap,
          });

          expect(result.newBalance).toBe(expected);
          expect(result.expiredAmount).toBe(0);
        }
      );
    });

    test('should handle purchased credits preserving rollover behavior', () => {
      // User has purchased credits that exceed cap, then gets subscription credits
      const purchasedCredits = 700; // Exceeds Starter cap
      const subscriptionCredits = 100; // Starter monthly

      const result = calculateBalanceWithExpiration({
        currentBalance: purchasedCredits,
        newCredits: subscriptionCredits,
        expirationMode: 'never',
        maxRollover: 600, // Starter cap
      });

      expect(result.newBalance).toBe(600); // Capped despite 800 total
      expect(result.expiredAmount).toBe(0);
    });
  });

  describe('Numerical Edge Cases', () => {
    test('should handle extremely large numbers safely', () => {
      const largeNumber = Number.MAX_SAFE_INTEGER - 1000;

      const result = calculateBalanceWithExpiration({
        currentBalance: largeNumber,
        newCredits: 100,
        expirationMode: 'never',
        maxRollover: null, // No cap
      });

      expect(result.newBalance).toBeGreaterThan(0);
      expect(result.expiredAmount).toBe(0);
      expect(Number.isSafeInteger(result.newBalance)).toBe(true);
    });

    test('should handle negative balances gracefully', () => {
      const negativeScenarios = [
        {
          currentBalance: -100,
          newCredits: 100,
          expected: 0, // Should balance out to 0
        },
        {
          currentBalance: -50,
          newCredits: 200,
          expected: 150, // Should result in 150
        },
        {
          currentBalance: -1000,
          newCredits: 100,
          expected: -900, // Should still be negative
        },
      ];

      negativeScenarios.forEach(({ currentBalance, newCredits, expected }) => {
        const result = calculateBalanceWithExpiration({
          currentBalance,
          newCredits,
          expirationMode: 'never',
          maxRollover: 1000,
        });

        expect(result.newBalance).toBe(expected);
        expect(result.expiredAmount).toBe(0);
      });
    });

    test('should handle zero values correctly', () => {
      const scenarios = [
        {
          name: 'Zero current balance',
          currentBalance: 0,
          newCredits: 100,
          expected: 100,
        },
        {
          name: 'Zero new credits',
          currentBalance: 500,
          newCredits: 0,
          expected: 500,
        },
        {
          name: 'Both zero',
          currentBalance: 0,
          newCredits: 0,
          expected: 0,
        },
      ];

      scenarios.forEach(({ name, currentBalance, newCredits, expected }) => {
        const result = calculateBalanceWithExpiration({
          currentBalance,
          newCredits,
          expirationMode: 'never',
          maxRollover: 600,
        });

        expect(result.newBalance).toBe(expected);
        expect(result.expiredAmount).toBe(0);
      });
    });

    test('should handle floating point edge cases', () => {
      const scenarios = [
        {
          currentBalance: 599.99,
          newCredits: 0.01,
          expected: 600, // Should cap at 600
        },
        {
          currentBalance: 599.5,
          newCredits: 100,
          expected: 600, // Should cap at 600
        },
      ];

      scenarios.forEach(({ currentBalance, newCredits, expected }) => {
        const result = calculateBalanceWithExpiration({
          currentBalance,
          newCredits,
          expirationMode: 'never',
          maxRollover: 600,
        });

        expect(Math.floor(result.newBalance)).toBe(expected);
      });
    });
  });

  describe('Cap Behavior Edge Cases', () => {
    test('should handle null/undefined maxRollover (no cap)', () => {
      const scenarios = [
        {
          maxRollover: null,
          currentBalance: 10000,
          newCredits: 1000,
          expected: 11000,
        },
        {
          maxRollover: undefined,
          currentBalance: 5000,
          newCredits: 500,
          expected: 5500,
        },
      ];

      scenarios.forEach(({ maxRollover, currentBalance, newCredits, expected }) => {
        const result = calculateBalanceWithExpiration({
          currentBalance,
          newCredits,
          expirationMode: 'never',
          maxRollover,
        });

        expect(result.newBalance).toBe(expected);
        expect(result.expiredAmount).toBe(0);
      });
    });

    test('should handle very small caps', () => {
      const scenarios = [
        {
          maxRollover: 1,
          currentBalance: 0,
          newCredits: 100,
          expected: 1,
        },
        {
          maxRollover: 10,
          currentBalance: 100,
          newCredits: 100,
          expected: 10,
        },
        {
          maxRollover: 0,
          currentBalance: 100,
          newCredits: 100,
          expected: 0,
        },
      ];

      scenarios.forEach(({ maxRollover, currentBalance, newCredits, expected }) => {
        const result = calculateBalanceWithExpiration({
          currentBalance,
          newCredits,
          expirationMode: 'never',
          maxRollover,
        });

        expect(result.newBalance).toBe(expected);
        expect(result.expiredAmount).toBe(0);
      });
    });
  });

  describe('Timing and Sequence Edge Cases', () => {
    test('should handle immediate consecutive plan changes', () => {
      let balance = 500;

      // Rapid upgrade: Starter -> Hobby -> Pro
      const hobbyPlan = CREDIT_COSTS.HOBBY_MONTHLY_CREDITS;
      const proPlan = CREDIT_COSTS.PRO_MONTHLY_CREDITS;

      // To Hobby
      let result = calculateBalanceWithExpiration({
        currentBalance: balance,
        newCredits: hobbyPlan,
        expirationMode: 'never',
        maxRollover: 1200,
      });
      balance = result.newBalance;

      // Immediately to Pro
      result = calculateBalanceWithExpiration({
        currentBalance: balance,
        newCredits: proPlan,
        expirationMode: 'never',
        maxRollover: 6000,
      });

      expect(result.newBalance).toBe(500 + hobbyPlan + proPlan);
      expect(result.expiredAmount).toBe(0);
    });

    test('should handle back-and-forth plan changes', () => {
      let balance = 300;

      // Starter -> Hobby -> Starter -> Hobby
      for (let i = 0; i < 4; i++) {
        const isStarter = i % 2 === 0;
        const credits = isStarter
          ? CREDIT_COSTS.STARTER_MONTHLY_CREDITS
          : CREDIT_COSTS.HOBBY_MONTHLY_CREDITS;
        const cap = isStarter ? 600 : 1200;

        const result = calculateBalanceWithExpiration({
          currentBalance: balance,
          newCredits: i === 0 ? credits : 0, // Only add credits on first change
          expirationMode: 'never',
          maxRollover: cap,
        });

        balance = result.newBalance;
      }

      // Final state should be Hobby cap if we started with enough credits
      expect(balance).toBeLessThanOrEqual(1200);
    });
  });

  describe('Real-world Scenarios', () => {
    test('should handle user who never uses credits', () => {
      let balance = 0;
      const starterPlan = CREDIT_COSTS.STARTER_MONTHLY_CREDITS;
      const starterCap = starterPlan * 6;

      // User accumulates credits for 6 months without usage
      for (let month = 0; month < 6; month++) {
        const result = calculateBalanceWithExpiration({
          currentBalance: balance,
          newCredits: starterPlan,
          expirationMode: 'never',
          maxRollover: starterCap,
        });
        balance = result.newBalance;
      }

      expect(balance).toBe(starterCap); // Should be at cap after 6 months

      // 7th month - should stay at cap
      const result = calculateBalanceWithExpiration({
        currentBalance: balance,
        newCredits: starterPlan,
        expirationMode: 'never',
        maxRollover: starterCap,
      });

      expect(result.newBalance).toBe(starterCap); // Still at cap
    });

    test('should handle user with consistent usage pattern', () => {
      let balance = 0;
      const starterPlan = CREDIT_COSTS.STARTER_MONTHLY_CREDITS;
      const starterCap = starterPlan * 6;
      const monthlyUsage = 50; // User uses 50 credits per month

      // Simulate 12 months of usage
      for (let month = 0; month < 12; month++) {
        // Add monthly credits
        let result = calculateBalanceWithExpiration({
          currentBalance: balance,
          newCredits: starterPlan,
          expirationMode: 'never',
          maxRollover: starterCap,
        });
        balance = result.newBalance;

        // Subtract usage
        balance -= monthlyUsage;
        balance = Math.max(0, balance); // Can't go negative
      }

      // Should reach equilibrium around cap - monthly usage
      expect(balance).toBeGreaterThan(0);
      expect(balance).toBeLessThanOrEqual(starterCap);
    });
  });
});
