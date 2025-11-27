import { test, expect } from '@playwright/test';
import { TestDataManager, ITestUser } from '../helpers/test-data-manager';
import { StripeWebhookMockFactory } from '../helpers/stripe-webhook-mocks';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Billing Workflow Integration Tests
 *
 * These tests verify complete billing workflows including:
 * - Credit pack purchases via Stripe
 * - Subscription management
 * - Webhook processing
 * - Credit allocation and deduction
 * - Billing portal access
 */

test.describe('Billing Workflow Integration', () => {
  let dataManager: TestDataManager;
  let supabase: SupabaseClient;
  let testUser: ITestUser;

  test.beforeAll(async () => {
    dataManager = new TestDataManager();
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  });

  test.afterAll(async () => {
    if (testUser) {
      await dataManager.cleanupUser(testUser.id);
    }
  });

  test.beforeEach(async () => {
    // Create fresh user for each test
    testUser = await dataManager.createTestUser();
  });

  test.describe('Credit Pack Purchases', () => {
    test('should handle complete credit pack purchase workflow', async ({ request }) => {
      // Step 1: Create checkout session
      const checkoutResponse = await request.post('/api/checkout', {
        headers: {
          Authorization: `Bearer ${testUser.token}`,
        },
        data: {
          priceId: 'price_1O2x3YExample', // Test price ID
          credits: 100,
          mode: 'payment',
        },
      });

      expect(checkoutResponse.ok()).toBeTruthy();
      const { checkoutUrl, sessionId } = await checkoutResponse.json();

      expect(checkoutUrl).toMatch(/^https:\/\/checkout\.stripe\.com/);
      expect(sessionId).toMatch(/^cs_test_/);

      // Step 2: Simulate successful payment via webhook
      const webhookEvent = StripeWebhookMockFactory.createCheckoutSessionCompletedForCredits({
        userId: testUser.id,
        creditsAmount: 100,
        sessionId: sessionId,
      });

      const webhookResponse = await request.post('/api/webhooks/stripe', {
        headers: {
          'Stripe-Signature': 'test-signature',
        },
        data: webhookEvent,
      });

      expect(webhookResponse.ok()).toBeTruthy();

      // Step 3: Verify credits were added
      const updatedProfile = await dataManager.getUserProfile(testUser.id);
      expect(updatedProfile.credits_balance).toBe(110); // 10 initial + 100 purchased

      // Step 4: Verify transaction was logged
      const transactions = await dataManager.getCreditTransactions(testUser.id);
      const purchaseTransaction = transactions.find(t => t.reference_id === sessionId);
      expect(purchaseTransaction).toMatchObject({
        amount: 100,
        type: 'purchase',
        description: expect.stringContaining('credit'),
      });
    });

    test('should handle different credit pack sizes', async ({ request }) => {
      const creditPacks = [
        { priceId: 'price_starter', credits: 25, expectedCost: 5 },
        { priceId: 'price_pro', credits: 100, expectedCost: 15 },
        { priceId: 'price_enterprise', credits: 500, expectedCost: 50 },
      ];

      for (const pack of creditPacks) {
        const user = await dataManager.createTestUser();
        const initialProfile = await dataManager.getUserProfile(user.id);

        const checkoutResponse = await request.post('/api/checkout', {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          data: {
            priceId: pack.priceId,
            credits: pack.credits,
            mode: 'payment',
          },
        });

        expect(checkoutResponse.ok()).toBeTruthy();
        const { sessionId } = await checkoutResponse.json();

        // Simulate webhook
        const webhookEvent = StripeWebhookMockFactory.createCheckoutSessionCompletedForCredits({
          userId: user.id,
          creditsAmount: pack.credits,
          sessionId: sessionId,
        });

        await request.post('/api/webhooks/stripe', {
          headers: {
            'Stripe-Signature': 'test-signature',
          },
          data: webhookEvent,
        });

        // Verify credits
        const finalProfile = await dataManager.getUserProfile(user.id);
        expect(finalProfile.credits_balance).toBe(
          (initialProfile.credits_balance as number) + pack.credits
        );

        await dataManager.cleanupUser(user.id);
      }
    });

    test('should handle failed payment gracefully', async ({ request }) => {
      const checkoutResponse = await request.post('/api/checkout', {
        headers: {
          Authorization: `Bearer ${testUser.token}`,
        },
        data: {
          priceId: 'price_test_failed',
          credits: 50,
          mode: 'payment',
        },
      });

      expect(checkoutResponse.ok()).toBeTruthy();
      const { sessionId } = await checkoutResponse.json();

      // Simulate failed payment
      const webhookEvent = StripeWebhookMockFactory.createCheckoutSessionAsyncPaymentFailed({
        userId: testUser.id,
        sessionId: sessionId,
      });

      const webhookResponse = await request.post('/api/webhooks/stripe', {
        headers: {
          'Stripe-Signature': 'test-signature',
        },
        data: webhookEvent,
      });

      expect(webhookResponse.ok()).toBeTruthy();

      // Verify no credits were added
      const profile = await dataManager.getUserProfile(testUser.id);
      expect(profile.credits_balance).toBe(10); // Still initial amount
    });
  });

  test.describe('Subscription Management', () => {
    test('should handle subscription creation and activation', async ({ request }) => {
      // Step 1: Create subscription checkout
      const checkoutResponse = await request.post('/api/checkout', {
        headers: {
          Authorization: `Bearer ${testUser.token}`,
        },
        data: {
          priceId: 'price_pro_monthly',
          mode: 'subscription',
        },
      });

      expect(checkoutResponse.ok()).toBeTruthy();
      const { checkoutUrl, sessionId } = await checkoutResponse.json();

      // Step 2: Simulate successful subscription creation
      const subscriptionEvent = StripeWebhookMockFactory.createCustomerSubscriptionCreated({
        userId: testUser.id,
        subscriptionId: 'sub_test_123',
        priceId: 'price_pro_monthly',
      });

      await request.post('/api/webhooks/stripe', {
        headers: {
          'Stripe-Signature': 'test-signature',
        },
        data: subscriptionEvent,
      });

      // Step 3: Verify subscription status
      const updatedProfile = await dataManager.getUserProfile(testUser.id);
      expect(updatedProfile.subscription_status).toBe('active');
      expect(updatedProfile.subscription_tier).toBe('pro');

      // Step 4: Simulate first payment success
      const invoiceEvent = StripeWebhookMockFactory.createInvoicePaymentSucceeded({
        userId: testUser.id,
        subscriptionId: 'sub_test_123',
        amount: 1500, // $15.00
      });

      await request.post('/api/webhooks/stripe', {
        headers: {
          'Stripe-Signature': 'test-signature',
        },
        data: invoiceEvent,
      });

      // Step 5: Verify monthly credits were added
      const finalProfile = await dataManager.getUserProfile(testUser.id);
      expect(finalProfile.credits_balance).toBeGreaterThanOrEqual(110); // 10 + 100 monthly
    });

    test('should handle subscription cancellation', async ({ request }) => {
      // First create active subscription
      await dataManager.setSubscriptionStatus(testUser.id, 'active', 'pro', 'sub_test_456');

      // Step 1: Access billing portal
      const portalResponse = await request.post('/api/portal', {
        headers: {
          Authorization: `Bearer ${testUser.token}`,
        },
        data: {
          returnUrl: 'http://localhost:3000/dashboard',
        },
      });

      expect(portalResponse.ok()).toBeTruthy();
      const { portalUrl } = await portalResponse.json();
      expect(portalUrl).toMatch(/^https:\/\/billing\.stripe\.com/);

      // Step 2: Simulate subscription cancellation via webhook
      const cancelEvent = StripeWebhookMockFactory.createCustomerSubscriptionDeleted({
        userId: testUser.id,
        subscriptionId: 'sub_test_456',
      });

      await request.post('/api/webhooks/stripe', {
        headers: {
          'Stripe-Signature': 'test-signature',
        },
        data: cancelEvent,
      });

      // Step 3: Verify subscription status was updated
      const profile = await dataManager.getUserProfile(testUser.id);
      expect(profile.subscription_status).toBe('canceled');
      expect(profile.subscription_tier).toBeNull(); // Tier cleared on cancellation
    });

    test('should handle subscription upgrade/downgrade', async ({ request }) => {
      // Start with pro subscription
      await dataManager.setSubscriptionStatus(testUser.id, 'active', 'pro', 'sub_test_pro');

      // Step 1: Upgrade to enterprise
      const upgradeEvent = StripeWebhookMockFactory.createCustomerSubscriptionUpdated({
        userId: testUser.id,
        subscriptionId: 'sub_test_pro',
        newPriceId: 'price_enterprise_monthly',
      });

      await request.post('/api/webhooks/stripe', {
        headers: {
          'Stripe-Signature': 'test-signature',
        },
        data: upgradeEvent,
      });

      // Verify upgrade
      const profile = await dataManager.getUserProfile(testUser.id);
      expect(profile.subscription_tier).toBe('enterprise');
      expect(profile.subscription_status).toBe('active');

      // Step 2: Downgrade back to pro
      const downgradeEvent = StripeWebhookMockFactory.createCustomerSubscriptionUpdated({
        userId: testUser.id,
        subscriptionId: 'sub_test_pro',
        newPriceId: 'price_pro_monthly',
      });

      await request.post('/api/webhooks/stripe', {
        headers: {
          'Stripe-Signature': 'test-signature',
        },
        data: downgradeEvent,
      });

      // Verify downgrade
      const finalProfile = await dataManager.getUserProfile(testUser.id);
      expect(finalProfile.subscription_tier).toBe('pro');
      expect(finalProfile.subscription_status).toBe('active');
    });
  });

  test.describe('Billing Portal Access', () => {
    test('should provide billing portal access for active users', async ({ request }) => {
      // Set up user with active subscription
      await dataManager.setSubscriptionStatus(testUser.id, 'active', 'pro');

      const portalResponse = await request.post('/api/portal', {
        headers: {
          Authorization: `Bearer ${testUser.token}`,
        },
        data: {
          returnUrl: 'http://localhost:3000/dashboard',
        },
      });

      expect(portalResponse.ok()).toBeTruthy();
      const { portalUrl } = await portalResponse.json();
      expect(portalUrl).toMatch(/^https:\/\/billing\.stripe\.com/);
      expect(portalUrl).toContain('return_url=');
    });

    test('should allow portal access for users with purchase history', async ({ request }) => {
      // Add some credits via purchase to create history
      await dataManager.addCredits(testUser.id, 25, 'purchase');

      const portalResponse = await request.post('/api/portal', {
        headers: {
          Authorization: `Bearer ${testUser.token}`,
        },
        data: {
          returnUrl: 'http://localhost:3000/dashboard',
        },
      });

      expect(portalResponse.ok()).toBeTruthy();
    });

    test('should restrict portal access for users without billing history', async ({ request }) => {
      // User has no subscription or purchase history
      const portalResponse = await request.post('/api/portal', {
        headers: {
          Authorization: `Bearer ${testUser.token}`,
        },
        data: {
          returnUrl: 'http://localhost:3000/dashboard',
        },
      });

      expect(portalResponse.status()).toBe(403);
      const { error } = await portalResponse.json();
      expect(error).toContain('No billing history found');
    });
  });

  test.describe('Webhook Processing', () => {
    test('should handle duplicate webhook events gracefully', async ({ request }) => {
      const sessionId = 'cs_test_duplicate_' + Date.now();

      // Create webhook event
      const webhookEvent = StripeWebhookMockFactory.createCheckoutSessionCompletedForCredits({
        userId: testUser.id,
        creditsAmount: 50,
        sessionId: sessionId,
      });

      // Send the same webhook twice
      const firstResponse = await request.post('/api/webhooks/stripe', {
        headers: {
          'Stripe-Signature': 'test-signature',
        },
        data: webhookEvent,
      });

      expect(firstResponse.ok()).toBeTruthy();

      const secondResponse = await request.post('/api/webhooks/stripe', {
        headers: {
          'Stripe-Signature': 'test-signature',
        },
        data: webhookEvent,
      });

      expect(secondResponse.ok()).toBeTruthy();

      // Verify credits were only added once
      const profile = await dataManager.getUserProfile(testUser.id);
      expect(profile.credits_balance).toBe(60); // 10 + 50, not 10 + 50 + 50

      // Verify only one transaction
      const transactions = await dataManager.getCreditTransactions(testUser.id);
      const purchaseTransactions = transactions.filter(t => t.reference_id === sessionId);
      expect(purchaseTransactions).toHaveLength(1);
    });

    test('should handle invalid webhook signatures', async ({ request }) => {
      const webhookEvent = StripeWebhookMockFactory.createCheckoutSessionCompletedForCredits({
        userId: testUser.id,
        creditsAmount: 25,
      });

      const response = await request.post('/api/webhooks/stripe', {
        headers: {
          'Stripe-Signature': 'invalid-signature',
        },
        data: webhookEvent,
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error).toContain('Invalid signature');

      // Verify no credits were added
      const profile = await dataManager.getUserProfile(testUser.id);
      expect(profile.credits_balance).toBe(10);
    });

    test('should handle malformed webhook events', async ({ request }) => {
      const malformedEvent = {
        id: 'evt_invalid',
        type: 'checkout.session.completed',
        data: null, // Missing object
      };

      const response = await request.post('/api/webhooks/stripe', {
        headers: {
          'Stripe-Signature': 'test-signature',
        },
        data: malformedEvent,
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('Credit System Integration', () => {
    test('should handle credit deductions for processing', async ({ request }) => {
      // Add credits first
      await dataManager.addCredits(testUser.id, 50, 'purchase');

      const initialProfile = await dataManager.getUserProfile(testUser.id);
      const initialBalance = initialProfile.credits_balance as number;

      // Simulate image processing job (this would normally be done by the upscaler service)
      const { error: deductError } = await supabase.rpc('decrement_credits_with_log', {
        target_user_id: testUser.id,
        amount: 3, // Cost for 2x upscale
        transaction_type: 'usage',
        ref_id: 'job_test_123',
        description: 'Image upscaling - 2x',
      });

      expect(deductError).toBeNull();

      // Verify deduction
      const finalProfile = await dataManager.getUserProfile(testUser.id);
      expect(finalProfile.credits_balance).toBe(initialBalance - 3);

      // Verify transaction
      const transactions = await dataManager.getCreditTransactions(testUser.id);
      const usageTransaction = transactions.find(t => t.reference_id === 'job_test_123');
      expect(usageTransaction).toMatchObject({
        amount: -3,
        type: 'usage',
        description: 'Image upscaling - 2x',
      });
    });

    test('should refund credits on processing failure', async ({ request }) => {
      // Add credits first
      await dataManager.addCredits(testUser.id, 25, 'purchase');

      const initialProfile = await dataManager.getUserProfile(testUser.id);
      const initialBalance = initialProfile.credits_balance as number;

      // Simulate failed processing with refund
      const { error: deductError } = await supabase.rpc('decrement_credits_with_log', {
        target_user_id: testUser.id,
        amount: 2,
        transaction_type: 'usage',
        ref_id: 'job_failed_456',
        description: 'Image upscaling - failed',
      });

      expect(deductError).toBeNull();

      // Now refund
      const { error: refundError } = await supabase.rpc('refund_credits', {
        target_user_id: testUser.id,
        amount: 2,
        job_id: 'job_failed_456',
      });

      expect(refundError).toBeNull();

      // Verify refund (balance should be back to original)
      const finalProfile = await dataManager.getUserProfile(testUser.id);
      expect(finalProfile.credits_balance).toBe(initialBalance);

      // Verify both transactions exist
      const transactions = await dataManager.getCreditTransactions(testUser.id);
      const usageTransaction = transactions.find(t => t.reference_id === 'job_failed_456' && t.type === 'usage');
      const refundTransaction = transactions.find(t => t.reference_id === 'job_failed_456' && t.type === 'refund');

      expect(usageTransaction).toMatchObject({ amount: -2, type: 'usage' });
      expect(refundTransaction).toMatchObject({ amount: 2, type: 'refund' });
    });
  });

  test.describe('Analytics and Reporting', () => {
    test('should track billing events in analytics', async ({ request }) => {
      // Create a purchase
      const checkoutResponse = await request.post('/api/checkout', {
        headers: {
          Authorization: `Bearer ${testUser.token}`,
        },
        data: {
          priceId: 'price_test_analytics',
          credits: 75,
          mode: 'payment',
        },
      });

      const { sessionId } = await checkoutResponse.json();

      // Simulate successful purchase
      const webhookEvent = StripeWebhookMockFactory.createCheckoutSessionCompletedForCredits({
        userId: testUser.id,
        creditsAmount: 75,
        sessionId: sessionId,
      });

      await request.post('/api/webhooks/stripe', {
        headers: {
          'Stripe-Signature': 'test-signature',
        },
        data: webhookEvent,
      });

      // Verify analytics event would be sent
      // In real implementation, you'd mock the analytics service
      // and verify the event was sent with correct properties

      // Verify transaction for reporting
      const transactions = await dataManager.getCreditTransactions(testUser.id);
      const purchaseTransaction = transactions.find(t => t.reference_id === sessionId);
      expect(purchaseTransaction).toMatchObject({
        amount: 75,
        type: 'purchase',
      });
    });

    test('should maintain audit trail for compliance', async ({ request }) => {
      // Perform multiple billing operations
      await dataManager.addCredits(testUser.id, 30, 'purchase');
      await supabase.rpc('decrement_credits_with_log', {
        target_user_id: testUser.id,
        amount: 5,
        transaction_type: 'usage',
        ref_id: 'compliance_test',
      });

      // Get complete transaction history
      const transactions = await dataManager.getCreditTransactions(testUser.id);

      // Verify audit trail properties
      transactions.forEach(transaction => {
        expect(transaction).toHaveProperty('created_at');
        expect(transaction).toHaveProperty('amount');
        expect(transaction).toHaveProperty('type');
        expect(transaction).toHaveProperty('user_id');
        expect(transaction.user_id).toBe(testUser.id);
      });

      // Verify chronological ordering
      for (let i = 1; i < transactions.length; i++) {
        const current = new Date(transactions[i].created_at as string);
        const previous = new Date(transactions[i - 1].created_at as string);
        expect(current.getTime()).toBeLessThanOrEqual(previous.getTime());
      }
    });
  });
});