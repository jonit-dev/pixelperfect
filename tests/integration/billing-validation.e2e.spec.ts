import { test, expect } from '@playwright/test';
import { TestDataManager } from '../helpers/test-data-manager';
import { StripeWebhookMockFactory } from '../helpers/stripe-webhook-mocks';

/**
 * Billing Integration Validation Tests
 *
 * These tests validate the TestDataManager helper and Stripe webhook mocks.
 * Note: Some operations (credit_transactions, subscriptions table) are blocked
 * by RLS policies, so tests focus on profile-level operations which work.
 */
test.describe('Billing Integration Validation', () => {
  let dataManager: TestDataManager;

  test.beforeAll(async () => {
    dataManager = new TestDataManager();
  });

  test.afterAll(async () => {
    await dataManager.cleanupAllUsers();
  });

  test('should create and manage test users correctly', async () => {
    // Test user creation
    const testUser = await dataManager.createTestUser();
    expect(testUser.id).toBeTruthy();
    expect(testUser.email).toContain('test-');
    expect(testUser.token).toBeTruthy();

    // Test setting subscription status (profile-level, works with RLS)
    await dataManager.setSubscriptionStatus(testUser.id, 'active', 'pro', 'sub_test_123');

    const profile = await dataManager.getUserProfile(testUser.id);
    expect(profile.subscription_status).toBe('active');
    expect(profile.subscription_tier).toBe('pro');

    // Test adding credits (balance update works, transaction logging may fail due to RLS)
    const initialBalance = profile.credits_balance;
    await dataManager.addCredits(testUser.id, 25, 'purchase');

    const updatedProfile = await dataManager.getUserProfile(testUser.id);
    expect(updatedProfile.credits_balance).toBe(initialBalance + 25);

    await dataManager.cleanupUser(testUser.id);
  });

  test('should generate valid Stripe webhook mocks', async () => {
    const testUser = await dataManager.createTestUser();

    // Test credit purchase webhook
    const creditPurchaseEvent = StripeWebhookMockFactory.createCheckoutSessionCompletedForCredits({
      userId: testUser.id,
      creditsAmount: 100,
    });

    expect(creditPurchaseEvent.type).toBe('checkout.session.completed');
    expect(creditPurchaseEvent.data.object.metadata?.user_id).toBe(testUser.id);
    expect(creditPurchaseEvent.data.object.metadata?.credits_amount).toBe('100');
    expect(creditPurchaseEvent.data.object.mode).toBe('payment');

    // Test subscription webhook
    const subscriptionEvent = StripeWebhookMockFactory.createSubscriptionCreated({
      userId: testUser.id,
      subscriptionId: 'sub_test_456',
      priceId: 'price_pro_monthly',
    });

    expect(subscriptionEvent.type).toBe('customer.subscription.created');
    expect(subscriptionEvent.data.object.id).toBe('sub_test_456');
    expect(subscriptionEvent.data.object.status).toBe('active');
    expect(subscriptionEvent.data.object.items.data[0].price.id).toBe('price_pro_monthly');

    // Test invoice payment webhook
    const invoiceEvent = StripeWebhookMockFactory.createInvoicePaymentSucceeded({
      userId: testUser.id,
      subscriptionId: 'sub_test_456',
    });

    expect(invoiceEvent.type).toBe('invoice.payment_succeeded');
    expect(invoiceEvent.data.object.subscription).toBe('sub_test_456');
    expect(invoiceEvent.data.object.paid).toBe(true);

    await dataManager.cleanupUser(testUser.id);
  });

  test('should handle different subscription scenarios via profile', async () => {
    // Test creating users with different states
    // Note: subscription_status defaults to null for new profiles,
    // we update it via setSubscriptionStatus

    const testUser = await dataManager.createTestUser();

    // Initial state should have credits
    const initialProfile = await dataManager.getUserProfile(testUser.id);
    expect(initialProfile.credits_balance).toBeGreaterThanOrEqual(0);

    // Set to active subscription
    await dataManager.setSubscriptionStatus(testUser.id, 'active', 'pro');
    const activeProfile = await dataManager.getUserProfile(testUser.id);
    expect(activeProfile.subscription_status).toBe('active');
    expect(activeProfile.subscription_tier).toBe('pro');

    // Set to canceled
    await dataManager.setSubscriptionStatus(testUser.id, 'canceled');
    const canceledProfile = await dataManager.getUserProfile(testUser.id);
    expect(canceledProfile.subscription_status).toBe('canceled');

    // Set to past_due
    await dataManager.setSubscriptionStatus(testUser.id, 'past_due');
    const pastDueProfile = await dataManager.getUserProfile(testUser.id);
    expect(pastDueProfile.subscription_status).toBe('past_due');

    await dataManager.cleanupUser(testUser.id);
  });

  test('should update credits balance correctly', async () => {
    const testUser = await dataManager.createTestUser();

    const initialProfile = await dataManager.getUserProfile(testUser.id);
    const initialBalance = initialProfile.credits_balance;

    // Add credits via different methods
    await dataManager.addCredits(testUser.id, 20, 'purchase');

    const afterFirstAdd = await dataManager.getUserProfile(testUser.id);
    expect(afterFirstAdd.credits_balance).toBe(initialBalance + 20);

    await dataManager.addCredits(testUser.id, 10, 'bonus');

    const finalProfile = await dataManager.getUserProfile(testUser.id);
    expect(finalProfile.credits_balance).toBe(initialBalance + 30);

    await dataManager.cleanupUser(testUser.id);
  });

  test('should verify profile state consistency across updates', async () => {
    const testUser = await dataManager.createTestUser();

    // Set initial state
    await dataManager.setSubscriptionStatus(testUser.id, 'active', 'pro');
    await dataManager.addCredits(testUser.id, 50, 'purchase');

    // Verify profile
    const profile = await dataManager.getUserProfile(testUser.id);
    expect(profile.subscription_status).toBe('active');
    expect(profile.subscription_tier).toBe('pro');

    const initialBalance = profile.credits_balance;

    // Update subscription status
    await dataManager.setSubscriptionStatus(testUser.id, 'canceled');

    const updatedProfile = await dataManager.getUserProfile(testUser.id);
    expect(updatedProfile.subscription_status).toBe('canceled');
    // Credits should remain unchanged when updating subscription
    expect(updatedProfile.credits_balance).toBe(initialBalance);

    await dataManager.cleanupUser(testUser.id);
  });
});
