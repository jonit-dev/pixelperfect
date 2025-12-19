import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { CREDIT_COSTS } from '../../shared/config/credits.config';
import {
  calculateBalanceWithExpiration,
  getPlanByKey,
} from '../../shared/config/subscription.utils';

describe('Plan Changes with Credit Preservation Integration Tests', () => {
  let supabase: SupabaseClient;
  let testUserId: string;

  // Test configuration
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  beforeAll(async () => {
    // Initialize Supabase client with service role for admin operations
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  });

  beforeEach(async () => {
    testUserId = 'profile_test_plan_changes';
  });

  describe('Plan Upgrade Scenarios', () => {
    test('should preserve credits when upgrading from Starter to Hobby', () => {
      const starterPlan = getPlanByKey('starter');
      const hobbyPlan = getPlanByKey('hobby');

      expect(starterPlan).not.toBeNull();
      expect(hobbyPlan).not.toBeNull();

      // User has 500 credits from Starter tier (under 600 cap)
      const currentBalance = 500;
      const newCredits = hobbyPlan!.creditsPerCycle; // 200
      const newCap = hobbyPlan!.maxRollover!; // 1200

      const result = calculateBalanceWithExpiration({
        currentBalance,
        newCredits,
        expirationMode: 'never',
        maxRollover: newCap,
      });

      expect(result.newBalance).toBe(700); // 500 + 200
      expect(result.expiredAmount).toBe(0);
      expect(result.newBalance).toBeLessThanOrEqual(newCap);
    });

    test('should preserve credits when upgrading from Starter to Pro', () => {
      const starterPlan = getPlanByKey('starter');
      const proPlan = getPlanByKey('pro');

      // User has maxed out Starter tier credits
      const currentBalance = starterPlan!.maxRollover!; // 600
      const newCredits = proPlan!.creditsPerCycle; // 1000
      const newCap = proPlan!.maxRollover!; // 6000

      const result = calculateBalanceWithExpiration({
        currentBalance,
        newCredits,
        expirationMode: 'never',
        maxRollover: newCap,
      });

      expect(result.newBalance).toBe(1600); // 600 + 1000
      expect(result.expiredAmount).toBe(0);
      expect(result.newBalance).toBeLessThanOrEqual(newCap);
    });

    test('should preserve credits when upgrading from Hobby to Pro', () => {
      const hobbyPlan = getPlanByKey('hobby');
      const proPlan = getPlanByKey('pro');

      // User has 1000 credits from Hobby tier
      const currentBalance = 1000;
      const newCredits = proPlan!.creditsPerCycle; // 1000
      const newCap = proPlan!.maxRollover!; // 6000

      const result = calculateBalanceWithExpiration({
        currentBalance,
        newCredits,
        expirationMode: 'never',
        maxRollover: newCap,
      });

      expect(result.newBalance).toBe(2000); // 1000 + 1000
      expect(result.expiredAmount).toBe(0);
      expect(result.newBalance).toBeLessThanOrEqual(newCap);
    });

    test('should handle full upgrade chain Starter -> Hobby -> Pro -> Business', () => {
      const plans = ['starter', 'hobby', 'pro', 'business'];
      let currentBalance = 0;

      plans.forEach((planKey, index) => {
        const plan = getPlanByKey(planKey);
        expect(plan).not.toBeNull();

        const newCredits = plan!.creditsPerCycle;
        const newCap = plan!.maxRollover!;

        const result = calculateBalanceWithExpiration({
          currentBalance,
          newCredits,
          expirationMode: 'never',
          maxRollover: newCap,
        });

        // Credits should always be preserved during upgrades
        const expectedBalance = Math.min(currentBalance + newCredits, newCap);
        expect(result.newBalance).toBe(expectedBalance);
        expect(result.expiredAmount).toBe(0);

        // Update for next iteration
        currentBalance = result.newBalance;

        // Verify we're at or under the cap
        expect(currentBalance).toBeLessThanOrEqual(newCap);
      });

      // Final balance should be Business tier cap since we accumulated through all tiers
      const businessPlan = getPlanByKey('business');
      expect(currentBalance).toBeLessThanOrEqual(businessPlan!.maxRollover!);
    });
  });

  describe('Plan Downgrade Scenarios', () => {
    test('should cap credits to new plan limit when downgrading', () => {
      const proPlan = getPlanByKey('pro');
      const starterPlan = getPlanByKey('starter');

      // User has 2000 credits from Pro tier
      const currentBalance = 2000;
      const newCredits = starterPlan!.creditsPerCycle; // 100
      const newCap = starterPlan!.maxRollover!; // 600

      const result = calculateBalanceWithExpiration({
        currentBalance,
        newCredits,
        expirationMode: 'never',
        maxRollover: newCap,
      });

      expect(result.newBalance).toBe(600); // Capped at Starter cap
      expect(result.expiredAmount).toBe(0);
    });

    test('should handle multiple monthly renewals after downgrade', () => {
      // Start with Pro tier credits
      let currentBalance = 2000; // From Pro plan

      // Downgrade to Starter
      const starterPlan = getPlanByKey('starter');
      const starterCap = starterPlan!.maxRollover!;
      const starterCredits = starterPlan!.creditsPerCycle;

      // First month after downgrade - capped immediately
      let result = calculateBalanceWithExpiration({
        currentBalance,
        newCredits: starterCredits,
        expirationMode: 'never',
        maxRollover: starterCap,
      });

      expect(result.newBalance).toBe(starterCap); // Capped at 600
      currentBalance = result.newBalance;

      // Second month - already at cap, no change
      result = calculateBalanceWithExpiration({
        currentBalance,
        newCredits: starterCredits,
        expirationMode: 'never',
        maxRollover: starterCap,
      });

      expect(result.newBalance).toBe(starterCap); // Still capped
    });

    test('should handle Pro to Hobby downgrade', () => {
      const proPlan = getPlanByKey('pro');
      const hobbyPlan = getPlanByKey('hobby');

      // User has 3000 credits from Pro tier
      const currentBalance = 3000;
      const newCredits = hobbyPlan!.creditsPerCycle; // 200
      const newCap = hobbyPlan!.maxRollover!; // 1200

      const result = calculateBalanceWithExpiration({
        currentBalance,
        newCredits,
        expirationMode: 'never',
        maxRollover: newCap,
      });

      expect(result.newBalance).toBe(1200); // Capped at Hobby cap
      expect(result.expiredAmount).toBe(0);
    });

    test('should handle Business to Starter direct downgrade', () => {
      const businessPlan = getPlanByKey('business');
      const starterPlan = getPlanByKey('starter');

      // User has maxed out Business tier credits
      const currentBalance = businessPlan!.maxRollover!; // 30000
      const newCredits = starterPlan!.creditsPerCycle; // 100
      const newCap = starterPlan!.maxRollover!; // 600

      const result = calculateBalanceWithExpiration({
        currentBalance,
        newCredits,
        expirationMode: 'never',
        maxRollover: newCap,
      });

      expect(result.newBalance).toBe(600); // Dramatically reduced to Starter cap
      expect(result.expiredAmount).toBe(0);
    });
  });

  describe('Edge Cases for Plan Changes', () => {
    test('should handle upgrade with existing credits at cap', () => {
      // User at Starter cap (600)
      let currentBalance = CREDIT_COSTS.STARTER_MONTHLY_CREDITS * 6;

      // Upgrade to Hobby
      const hobbyPlan = getPlanByKey('hobby');
      const hobbyCap = hobbyPlan!.maxRollover!;
      const hobbyCredits = hobbyPlan!.creditsPerCycle;

      const result = calculateBalanceWithExpiration({
        currentBalance,
        newCredits: hobbyCredits,
        expirationMode: 'never',
        maxRollover: hobbyCap,
      });

      expect(result.newBalance).toBe(800); // 600 + 200
      expect(result.expiredAmount).toBe(0);
      expect(result.newBalance).toBeLessThan(hobbyCap); // Still under Hobby cap
    });

    test('should handle immediate upgrade followed by downgrade in same cycle', () => {
      let currentBalance = 500; // Starting balance

      // Upgrade from Starter to Hobby
      const hobbyPlan = getPlanByKey('hobby');
      let result = calculateBalanceWithExpiration({
        currentBalance,
        newCredits: hobbyPlan!.creditsPerCycle,
        expirationMode: 'never',
        maxRollover: hobbyPlan!.maxRollover!,
      });

      currentBalance = result.newBalance; // 500 + 200 = 700

      // Immediate downgrade back to Starter
      const starterPlan = getPlanByKey('starter');
      result = calculateBalanceWithExpiration({
        currentBalance,
        newCredits: 0, // No new credits, just cap change
        expirationMode: 'never',
        maxRollover: starterPlan!.maxRollover!,
      });

      expect(result.newBalance).toBe(600); // Capped at Starter level
      expect(result.expiredAmount).toBe(0);
    });

    test('should handle zero balance scenarios', () => {
      const scenarios = [
        { from: 'starter', to: 'hobby' },
        { from: 'hobby', to: 'pro' },
        { from: 'starter', to: 'business' },
      ];

      scenarios.forEach(({ from, to }) => {
        const fromPlan = getPlanByKey(from);
        const toPlan = getPlanByKey(to);

        const result = calculateBalanceWithExpiration({
          currentBalance: 0,
          newCredits: toPlan!.creditsPerCycle,
          expirationMode: 'never',
          maxRollover: toPlan!.maxRollover!,
        });

        expect(result.newBalance).toBe(toPlan!.creditsPerCycle);
        expect(result.expiredAmount).toBe(0);
      });
    });
  });

  describe('Rollover Cap Compliance', () => {
    test('should always respect current plan cap regardless of history', () => {
      // Simulate a user who had Business tier, downgraded to Hobby, now at Hobby cap
      const currentBalance = 1200; // At Hobby cap
      const hobbyPlan = getPlanByKey('hobby');

      const result = calculateBalanceWithExpiration({
        currentBalance,
        newCredits: hobbyPlan!.creditsPerCycle,
        expirationMode: 'never',
        maxRollover: hobbyPlan!.maxRollover!,
      });

      expect(result.newBalance).toBe(hobbyPlan!.maxRollover); // Still capped
      expect(result.expiredAmount).toBe(0);
    });

    test('should handle cap differences across all tiers', () => {
      const plans = [
        { key: 'starter', expectedCap: 600 },
        { key: 'hobby', expectedCap: 1200 },
        { key: 'pro', expectedCap: 6000 },
        { key: 'business', expectedCap: 30000 },
      ];

      plans.forEach(({ key, expectedCap }) => {
        const plan = getPlanByKey(key);
        expect(plan?.maxRollover).toBe(expectedCap);

        // Test with balance exceeding cap
        const result = calculateBalanceWithExpiration({
          currentBalance: expectedCap + 1000,
          newCredits: plan!.creditsPerCycle,
          expirationMode: 'never',
          maxRollover: expectedCap,
        });

        expect(result.newBalance).toBe(expectedCap); // Should be capped
        expect(result.expiredAmount).toBe(0);
      });
    });
  });

  describe('Multiple Plan Change Scenarios', () => {
    test('should handle complex upgrade/downgrade path', () => {
      let balance = 0;

      // Start with Starter
      const starterPlan = getPlanByKey('starter');
      balance = starterPlan!.creditsPerCycle; // 100

      // Upgrade to Hobby
      const hobbyPlan = getPlanByKey('hobby');
      const result1 = calculateBalanceWithExpiration({
        currentBalance: balance,
        newCredits: hobbyPlan!.creditsPerCycle,
        expirationMode: 'never',
        maxRollover: hobbyPlan!.maxRollover!,
      });
      balance = result1.newBalance; // 100 + 200 = 300

      // Upgrade to Pro
      const proPlan = getPlanByKey('pro');
      const result2 = calculateBalanceWithExpiration({
        currentBalance: balance,
        newCredits: proPlan!.creditsPerCycle,
        expirationMode: 'never',
        maxRollover: proPlan!.maxRollover!,
      });
      balance = result2.newBalance; // 300 + 1000 = 1300

      // Downgrade back to Starter
      const result3 = calculateBalanceWithExpiration({
        currentBalance: balance,
        newCredits: starterPlan!.creditsPerCycle,
        expirationMode: 'never',
        maxRollover: starterPlan!.maxRollover!,
      });

      expect(result3.newBalance).toBe(600); // Capped at Starter level
      expect(result3.expiredAmount).toBe(0);
    });

    test('should preserve purchased credits during plan changes', () => {
      // User has purchased credits that should be preserved
      const subscriptionCredits = 200;
      const purchasedCredits = 300;
      const totalBalance = subscriptionCredits + purchasedCredits; // 500

      // Change to Starter plan
      const starterPlan = getPlanByKey('starter');
      const result = calculateBalanceWithExpiration({
        currentBalance: totalBalance,
        newCredits: starterPlan!.creditsPerCycle,
        expirationMode: 'never',
        maxRollover: starterPlan!.maxRollover!,
      });

      expect(result.newBalance).toBe(600); // 500 + 100, capped at 600
      expect(result.expiredAmount).toBe(0);
    });
  });
});
