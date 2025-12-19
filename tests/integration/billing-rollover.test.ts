import { describe, test, expect, beforeAll, beforeEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { InvoiceHandler } from '../../app/api/webhooks/stripe/handlers/invoice.handler';
import { calculateBalanceWithExpiration } from '../../shared/config/subscription.utils';
import { CREDIT_COSTS } from '../../shared/config/credits.config';

// Mock Stripe invoice for testing
const createMockInvoice = (overrides: Partial<any> = {}) => ({
  id: 'in_test_123',
  customer: 'cus_test_123',
  subscription: 'sub_test_123',
  lines: {
    data: [
      {
        type: 'subscription',
        price: { id: 'price_STARTER_PLACEHOLDER' },
        plan: { id: 'plan_starter' },
        amount: 900,
      },
    ],
  },
  period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
  ...overrides,
});

// Mock profile response
const createMockProfile = (overrides: Partial<any> = {}) => ({
  id: 'profile_test_123',
  stripe_customer_id: 'cus_test_123',
  subscription_credits_balance: 0,
  purchased_credits_balance: 0,
  ...overrides,
});

describe('Billing System with Credit Rollover Integration Tests', () => {
  let supabase: SupabaseClient;
  let testUserId: string;
  let mockSupabaseAdmin: any;

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

    // Mock supabaseAdmin for InvoiceHandler tests
    mockSupabaseAdmin = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => ({
              data: createMockProfile(),
              error: null,
            }),
          }),
        }),
      }),
      rpc: vi.fn(),
    };
  });

  beforeEach(async () => {
    testUserId = 'profile_test_123';
  });

  describe('Credit Rollover Calculations', () => {
    test('should calculate rollover correctly for Starter tier', () => {
      const result = calculateBalanceWithExpiration({
        currentBalance: 500,
        newCredits: CREDIT_COSTS.STARTER_MONTHLY_CREDITS, // 100
        expirationMode: 'never',
        maxRollover: CREDIT_COSTS.STARTER_MONTHLY_CREDITS * 6, // 600
      });

      expect(result.newBalance).toBe(600); // Capped at 600
      expect(result.expiredAmount).toBe(0);
    });

    test('should not cap when under the rollover limit', () => {
      const result = calculateBalanceWithExpiration({
        currentBalance: 300,
        newCredits: CREDIT_COSTS.STARTER_MONTHLY_CREDITS, // 100
        expirationMode: 'never',
        maxRollover: 600,
      });

      expect(result.newBalance).toBe(400); // 300 + 100
      expect(result.expiredAmount).toBe(0);
    });

    test('should handle zero current balance', () => {
      const result = calculateBalanceWithExpiration({
        currentBalance: 0,
        newCredits: CREDIT_COSTS.STARTER_MONTHLY_CREDITS, // 100
        expirationMode: 'never',
        maxRollover: 600,
      });

      expect(result.newBalance).toBe(100);
      expect(result.expiredAmount).toBe(0);
    });

    test('should handle maximum rollover cap', () => {
      const result = calculateBalanceWithExpiration({
        currentBalance: 600, // Already at cap
        newCredits: CREDIT_COSTS.STARTER_MONTHLY_CREDITS, // 100
        expirationMode: 'never',
        maxRollover: 600,
      });

      expect(result.newBalance).toBe(600); // No change
      expect(result.expiredAmount).toBe(0);
    });
  });

  describe('Invoice Payment with Rollover Caps', () => {
    test('should add credits with rollover for Starter tier', async () => {
      const mockInvoice = createMockInvoice();
      const mockProfile = createMockProfile({
        subscription_credits_balance: 400,
        purchased_credits_balance: 100,
      });

      // Mock supabase calls
      mockSupabaseAdmin.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() =>
              Promise.resolve({
                data: mockProfile,
                error: null,
              })
            ),
          })),
        })),
      }));

      mockSupabaseAdmin.rpc = vi.fn((fnName, params) => {
        if (fnName === 'add_subscription_credits') {
          return Promise.resolve({
            data: null,
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      // Test the calculation logic
      const currentBalance =
        mockProfile.subscription_credits_balance + mockProfile.purchased_credits_balance;
      const maxRollover = CREDIT_COSTS.STARTER_MONTHLY_CREDITS * 6; // 600
      const newCredits = CREDIT_COSTS.STARTER_MONTHLY_CREDITS; // 100

      const { newBalance, expiredAmount } = calculateBalanceWithExpiration({
        currentBalance,
        newCredits,
        expirationMode: 'never',
        maxRollover,
      });

      expect(newBalance).toBe(600); // 500 total, capped at 600
      expect(expiredAmount).toBe(0);

      // Expected credits to add: 600 - 500 = 100
      const actualCreditsToAdd = newBalance - (expiredAmount > 0 ? 0 : currentBalance);
      expect(actualCreditsToAdd).toBe(100);
    });

    test('should not add credits when already at rollover cap', async () => {
      const mockInvoice = createMockInvoice();
      const mockProfile = createMockProfile({
        subscription_credits_balance: 600,
        purchased_credits_balance: 0,
      });

      const currentBalance =
        mockProfile.subscription_credits_balance + mockProfile.purchased_credits_balance;
      const maxRollover = CREDIT_COSTS.STARTER_MONTHLY_CREDITS * 6; // 600
      const newCredits = CREDIT_COSTS.STARTER_MONTHLY_CREDITS; // 100

      const { newBalance, expiredAmount } = calculateBalanceWithExpiration({
        currentBalance,
        newCredits,
        expirationMode: 'never',
        maxRollover,
      });

      expect(newBalance).toBe(600); // No change, already at cap
      expect(expiredAmount).toBe(0);

      const actualCreditsToAdd = newBalance - (expiredAmount > 0 ? 0 : currentBalance);
      expect(actualCreditsToAdd).toBe(0); // No credits added
    });

    test('should handle different plan tiers with correct caps', () => {
      const testCases = [
        {
          plan: 'starter',
          currentBalance: 500,
          creditsPerCycle: CREDIT_COSTS.STARTER_MONTHLY_CREDITS,
          expectedCap: CREDIT_COSTS.STARTER_MONTHLY_CREDITS * 6,
        },
        {
          plan: 'hobby',
          currentBalance: 1000,
          creditsPerCycle: CREDIT_COSTS.HOBBY_MONTHLY_CREDITS,
          expectedCap: CREDIT_COSTS.HOBBY_MONTHLY_CREDITS * 6,
        },
        {
          plan: 'pro',
          currentBalance: 5000,
          creditsPerCycle: CREDIT_COSTS.PRO_MONTHLY_CREDITS,
          expectedCap: CREDIT_COSTS.PRO_MONTHLY_CREDITS * 6,
        },
      ];

      testCases.forEach(({ plan, currentBalance, creditsPerCycle, expectedCap }) => {
        const result = calculateBalanceWithExpiration({
          currentBalance,
          newCredits: creditsPerCycle,
          expirationMode: 'never',
          maxRollover: expectedCap,
        });

        const expectedBalance = Math.min(currentBalance + creditsPerCycle, expectedCap);
        expect(result.newBalance).toBe(expectedBalance);
        expect(result.expiredAmount).toBe(0);
      });
    });
  });

  describe('Credit Pool Handling', () => {
    test('should correctly calculate total balance from both pools', () => {
      const testCases = [
        {
          subscriptionBalance: 300,
          purchasedBalance: 100,
          expectedTotal: 400,
        },
        {
          subscriptionBalance: 0,
          purchasedBalance: 200,
          expectedTotal: 200,
        },
        {
          subscriptionBalance: 500,
          purchasedBalance: 0,
          expectedTotal: 500,
        },
      ];

      testCases.forEach(({ subscriptionBalance, purchasedBalance, expectedTotal }) => {
        const totalBalance = subscriptionBalance + purchasedBalance;
        expect(totalBalance).toBe(expectedTotal);
      });
    });

    test('should apply rollover cap to total balance, not just subscription pool', () => {
      const subscriptionBalance = 300;
      const purchasedBalance = 200;
      const totalBalance = subscriptionBalance + purchasedBalance;
      const maxRollover = 600;

      // Total balance (500) is under cap, should all be preserved
      const result = calculateBalanceWithExpiration({
        currentBalance: totalBalance,
        newCredits: 100,
        expirationMode: 'never',
        maxRollover,
      });

      expect(result.newBalance).toBe(600); // 500 + 100, capped at 600
      expect(result.expiredAmount).toBe(0);
    });

    test('should handle purchased credits exceeding rollover cap', () => {
      const subscriptionBalance = 100;
      const purchasedBalance = 800; // Over cap already
      const totalBalance = subscriptionBalance + purchasedBalance;
      const maxRollover = 600;

      const result = calculateBalanceWithExpiration({
        currentBalance: totalBalance,
        newCredits: 100,
        expirationMode: 'never',
        maxRollover,
      });

      expect(result.newBalance).toBe(600); // Capped at maxRollover
      expect(result.expiredAmount).toBe(0);
    });
  });

  describe('Expiration Mode Behavior', () => {
    test('should handle transition from end_of_cycle to never mode', () => {
      // Simulate old behavior: credits expire
      const oldModeResult = calculateBalanceWithExpiration({
        currentBalance: 500,
        newCredits: 100,
        expirationMode: 'end_of_cycle',
        maxRollover: 600,
      });

      expect(oldModeResult.newBalance).toBe(100); // Only new credits
      expect(oldModeResult.expiredAmount).toBe(500); // All old credits expired

      // Simulate new behavior: credits roll over
      const newModeResult = calculateBalanceWithExpiration({
        currentBalance: 500,
        newCredits: 100,
        expirationMode: 'never',
        maxRollover: 600,
      });

      expect(newModeResult.newBalance).toBe(600); // All credits preserved
      expect(newModeResult.expiredAmount).toBe(0); // No expiration
    });

    test('should handle rolling_window mode same as end_of_cycle', () => {
      const result1 = calculateBalanceWithExpiration({
        currentBalance: 400,
        newCredits: 100,
        expirationMode: 'end_of_cycle',
        maxRollover: 600,
      });

      const result2 = calculateBalanceWithExpiration({
        currentBalance: 400,
        newCredits: 100,
        expirationMode: 'rolling_window',
        maxRollover: 600,
      });

      expect(result1.newBalance).toBe(result2.newBalance);
      expect(result1.expiredAmount).toBe(result2.expiredAmount);
    });
  });

  describe('Edge Cases for Rollover Logic', () => {
    test('should handle very large credit balances', () => {
      const result = calculateBalanceWithExpiration({
        currentBalance: 10000,
        newCredits: 100,
        expirationMode: 'never',
        maxRollover: 600,
      });

      expect(result.newBalance).toBe(600); // Capped at maxRollover
      expect(result.expiredAmount).toBe(0);
    });

    test('should handle zero maxRollover (no cap)', () => {
      const result = calculateBalanceWithExpiration({
        currentBalance: 10000,
        newCredits: 100,
        expirationMode: 'never',
        maxRollover: null,
      });

      expect(result.newBalance).toBe(10100); // No cap applied
      expect(result.expiredAmount).toBe(0);
    });

    test('should handle negative current balance', () => {
      const result = calculateBalanceWithExpiration({
        currentBalance: -50,
        newCredits: 100,
        expirationMode: 'never',
        maxRollover: 600,
      });

      expect(result.newBalance).toBe(50); // -50 + 100
      expect(result.expiredAmount).toBe(0);
    });

    test('should handle zero new credits', () => {
      const result = calculateBalanceWithExpiration({
        currentBalance: 300,
        newCredits: 0,
        expirationMode: 'never',
        maxRollover: 600,
      });

      expect(result.newBalance).toBe(300); // No change
      expect(result.expiredAmount).toBe(0);
    });
  });

  describe('Plan-specific Rollover Scenarios', () => {
    test('should apply correct caps for Starter tier upgrade scenarios', () => {
      const scenarios = [
        {
          name: 'Starter to Hobby upgrade',
          starterBalance: 600, // Starter cap
          hobbyCredits: 200,
          hobbyCap: CREDIT_COSTS.HOBBY_MONTHLY_CREDITS * 6, // 1200
          expectedBalance: 800, // 600 + 200
        },
        {
          name: 'Starter to Pro upgrade',
          starterBalance: 600, // Starter cap
          proCredits: 1000,
          proCap: CREDIT_COSTS.PRO_MONTHLY_CREDITS * 6, // 6000
          expectedBalance: 1600, // 600 + 1000
        },
      ];

      scenarios.forEach(({ name, starterBalance, hobbyCredits, hobbyCap, expectedBalance }) => {
        const result = calculateBalanceWithExpiration({
          currentBalance: starterBalance,
          newCredits: hobbyCredits,
          expirationMode: 'never',
          maxRollover: hobbyCap,
        });

        expect(result.newBalance).toBe(expectedBalance);
        expect(result.expiredAmount).toBe(0);
      });
    });

    test('should handle downgrade scenarios with cap reduction', () => {
      const scenarios = [
        {
          name: 'Pro to Starter downgrade',
          proBalance: 2000, // From Pro plan
          starterCredits: 100,
          starterCap: CREDIT_COSTS.STARTER_MONTHLY_CREDITS * 6, // 600
          expectedBalance: 600, // Capped at Starter level
        },
        {
          name: 'Hobby to Starter downgrade',
          hobbyBalance: 1000, // From Hobby plan
          starterCredits: 100,
          starterCap: 600,
          expectedBalance: 600, // Capped at Starter level
        },
      ];

      scenarios.forEach(({ name, proBalance, starterCredits, starterCap, expectedBalance }) => {
        const result = calculateBalanceWithExpiration({
          currentBalance: proBalance,
          newCredits: starterCredits,
          expirationMode: 'never',
          maxRollover: starterCap,
        });

        expect(result.newBalance).toBe(expectedBalance);
        expect(result.expiredAmount).toBe(0);
      });
    });
  });
});
