import { test, expect } from '@playwright/test';
import { resetTestUser } from '../helpers/test-user-reset';
import { TestDataManager } from '../helpers/test-data-manager';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe('API: Stripe Webhooks - Subscription Only', () => {
  test.describe('checkout.session.completed', () => {
    test('should handle subscription checkout completion', async ({ request }) => {
      const testUser = await resetTestUser();

      // Create checkout session webhook payload for subscription
      const subscriptionSessionPayload = {
        id: 'cs_test_subscription_completed',
        object: 'checkout.session',
        mode: 'subscription',
        status: 'complete',
        customer: 'cus_test_subscription',
        subscription: 'sub_test_subscription',
        metadata: {
          user_id: testUser.id,
          plan_key: 'hobby',
        },
      };

      // Send webhook event
      const response = await request.post('/api/webhooks/stripe', {
        data: subscriptionSessionPayload,
        headers: {
          'stripe-signature': 'test_signature',
        },
      });

      // Should be processed successfully
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual({ received: true });
    });

    test('should reject one-time payment checkout sessions', async ({ request }) => {
      const testUser = await resetTestUser();

      // Create checkout session webhook payload for one-time payment
      const oneTimeSessionPayload = {
        id: 'cs_test_one_time_completed',
        object: 'checkout.session',
        mode: 'payment',
        status: 'complete',
        customer: 'cus_test_onetime',
        metadata: {
          user_id: testUser.id,
          credits_amount: '100',
        },
      };

      // Send webhook event
      const response = await request.post('/api/webhooks/stripe', {
        data: oneTimeSessionPayload,
        headers: {
          'stripe-signature': 'test_signature',
        },
      });

      // Should be processed but with warning
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual({ received: true });
    });

    test('should handle missing user_id gracefully', async ({ request }) => {
      const subscriptionSessionPayload = {
        id: 'cs_test_missing_user',
        object: 'checkout.session',
        mode: 'subscription',
        status: 'complete',
        metadata: {
          plan_key: 'pro',
          // Missing user_id
        },
      };

      const response = await request.post('/api/webhooks/stripe', {
        data: subscriptionSessionPayload,
        headers: {
          'stripe-signature': 'test_signature',
        },
      });

      // Should handle gracefully without error
      expect(response.status()).toBe(200);
    });
  });

  test.describe('customer.subscription.created/updated', () => {
    test('should create/update subscription with valid subscription price', async ({ request }) => {
      const testUser = await resetTestUser();

      // Set up customer ID in profile
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: 'cus_test_sub_create' })
        .eq('id', testUser.id);

      // Get actual subscription price ID from config
      const { STRIPE_PRICES } = await import('@shared/config/stripe');

      const subscriptionPayload = {
        id: 'sub_test_subscription_created',
        object: 'subscription',
        customer: 'cus_test_sub_create',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
        cancel_at_period_end: false,
        canceled_at: null,
        items: {
          data: [
            {
              price: {
                id: STRIPE_PRICES.HOBBY_MONTHLY,
              },
            },
          ],
        },
      };

      const response = await request.post('/api/webhooks/stripe', {
        data: subscriptionPayload,
        headers: {
          'stripe-signature': 'test_signature',
        },
      });

      expect(response.status()).toBe(200);

      // Verify subscription was created in database
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', 'sub_test_subscription_created')
        .single();

      expect(subscription).toBeTruthy();
      expect(subscription!.status).toBe('active');
      expect(subscription!.price_id).toBe(STRIPE_PRICES.HOBBY_MONTHLY);

      // Verify profile was updated with human-readable plan name
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_tier')
        .eq('id', testUser.id)
        .single();

      expect(profile!.subscription_status).toBe('active');
      expect(profile!.subscription_tier).toBe('Hobby'); // Human-readable name
    });

    test('should reject subscription with invalid price ID', async ({ request }) => {
      const testUser = await resetTestUser();

      // Set up customer ID in profile
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: 'cus_test_invalid_price' })
        .eq('id', testUser.id);

      const invalidSubscriptionPayload = {
        id: 'sub_test_invalid_price',
        object: 'subscription',
        customer: 'cus_test_invalid_price',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        cancel_at_period_end: false,
        canceled_at: null,
        items: {
          data: [
            {
              price: {
                id: 'price_invalid_credit_pack_123', // Invalid price ID
              },
            },
          ],
        },
      };

      const response = await request.post('/api/webhooks/stripe', {
        data: invalidSubscriptionPayload,
        headers: {
          'stripe-signature': 'test_signature',
        },
      });

      // Should process but log error
      expect(response.status()).toBe(200);

      // Verify subscription was NOT created in database
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', 'sub_test_invalid_price')
        .single();

      expect(subscription).toBeFalsy();
    });

    test('should handle subscription with all valid price tiers', async ({ request }) => {
      const { STRIPE_PRICES } = await import('@shared/config/stripe');
      const planTests = [
        { priceId: STRIPE_PRICES.HOBBY_MONTHLY, planName: 'Hobby', planKey: 'hobby' },
        { priceId: STRIPE_PRICES.PRO_MONTHLY, planName: 'Professional', planKey: 'pro' },
        { priceId: STRIPE_PRICES.BUSINESS_MONTHLY, planName: 'Business', planKey: 'business' },
      ];

      for (const { priceId, planName, planKey } of planTests) {
        const testUser = await resetTestUser();

        // Set up customer ID
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
        await supabase
          .from('profiles')
          .update({
            stripe_customer_id: `cus_test_${planKey}_price`,
            subscription_tier: null, // Reset tier
          })
          .eq('id', testUser.id);

        const subscriptionPayload = {
          id: `sub_test_${planKey}_verified`,
          object: 'subscription',
          customer: `cus_test_${planKey}_price`,
          status: 'active',
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          cancel_at_period_end: false,
          canceled_at: null,
          items: {
            data: [{ price: { id: priceId } }],
          },
        };

        const response = await request.post('/api/webhooks/stripe', {
          data: subscriptionPayload,
          headers: { 'stripe-signature': 'test_signature' },
        });

        expect(response.status()).toBe(200);

        // Verify profile was updated with correct plan name
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', testUser.id)
          .single();

        expect(profile!.subscription_tier).toBe(planName);
      }
    });
  });

  test.describe('customer.subscription.deleted', () => {
    test('should handle subscription cancellation', async ({ request }) => {
      const testUser = await resetTestUser();

      // Set up customer and existing subscription
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
      await supabase
        .from('profiles')
        .update({
          stripe_customer_id: 'cus_test_cancellation',
          subscription_status: 'active',
        })
        .eq('id', testUser.id);

      // Create existing subscription
      await supabase
        .from('subscriptions')
        .insert({
          id: 'sub_test_cancellation',
          user_id: testUser.id,
          status: 'active',
          price_id: 'price_hobby_monthly',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

      const cancellationPayload = {
        id: 'sub_test_cancellation',
        object: 'subscription',
        customer: 'cus_test_cancellation',
        status: 'canceled',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        cancel_at_period_end: false,
        canceled_at: Math.floor(Date.now() / 1000),
        items: { data: [{ price: { id: 'price_hobby_monthly' } }] },
      };

      const response = await request.post('/api/webhooks/stripe', {
        data: cancellationPayload,
        headers: { 'stripe-signature': 'test_signature' },
      });

      expect(response.status()).toBe(200);

      // Verify subscription was marked as canceled
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, canceled_at')
        .eq('id', 'sub_test_cancellation')
        .single();

      expect(subscription!.status).toBe('canceled');
      expect(subscription!.canceled_at).toBeTruthy();

      // Verify profile was updated
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', testUser.id)
        .single();

      expect(profile!.subscription_status).toBe('canceled');
    });
  });

  test.describe('invoice.payment_succeeded', () => {
    test('should add subscription credits with rollover cap', async ({ request }) => {
      const testUser = await resetTestUser();

      // Set up customer with some existing credits
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
      await supabase
        .from('profiles')
        .update({
          stripe_customer_id: 'cus_test_renewal',
          credits_balance: 1100, // Close to hobby plan max rollover (1200)
        })
        .eq('id', testUser.id);

      const { STRIPE_PRICES } = await import('@shared/config/stripe');

      const invoicePayload = {
        id: 'in_test_renewal_success',
        object: 'invoice',
        customer: 'cus_test_renewal',
        subscription: 'sub_test_renewal',
        status: 'paid',
        paid: true,
        lines: {
          data: [
            {
              price: {
                id: STRIPE_PRICES.HOBBY_MONTHLY, // Hobby plan: 200 credits/month, 1200 max rollover
              },
            },
          ],
        },
      };

      const response = await request.post('/api/webhooks/stripe', {
        data: invoicePayload,
        headers: { 'stripe-signature': 'test_signature' },
      });

      expect(response.status()).toBe(200);

      // Verify credits were added correctly (1100 + 100 = 1200, capped at max)
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits_balance')
        .eq('id', testUser.id)
        .single();

      expect(profile!.credits_balance).toBe(1200); // Capped at hobby max rollover

      // Verify credit transaction was logged
      const { data: transaction } = await supabase
        .from('credit_transactions')
        .select('amount, transaction_type, description')
        .eq('user_id', testUser.id)
        .eq('ref_id', 'in_test_renewal_success')
        .single();

      expect(transaction).toBeTruthy();
      expect(transaction!.amount).toBe(100); // Only 100 added due to cap
      expect(transaction!.transaction_type).toBe('subscription');
      expect(transaction!.description).toContain('Hobby plan');
      expect(transaction!.description).toContain('capped from 200');
    });

    test('should handle unknown price IDs gracefully', async ({ request }) => {
      const testUser = await resetTestUser();

      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
      await supabase
        .from('profiles')
        .update({
          stripe_customer_id: 'cus_test_unknown_price',
          credits_balance: 100,
        })
        .eq('id', testUser.id);

      const unknownPriceInvoice = {
        id: 'in_test_unknown_price',
        object: 'invoice',
        customer: 'cus_test_unknown_price',
        subscription: 'sub_test_unknown_price',
        status: 'paid',
        paid: true,
        lines: {
          data: [
            {
              price: {
                id: 'price_unknown_credit_pack', // Not in subscription map
              },
            },
          ],
        },
      };

      const response = await request.post('/api/webhooks/stripe', {
        data: unknownPriceInvoice,
        headers: { 'stripe-signature': 'test_signature' },
      });

      expect(response.status()).toBe(200);

      // Verify no credits were added
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits_balance')
        .eq('id', testUser.id)
        .single();

      expect(profile!.credits_balance).toBe(100); // Unchanged
    });

    test('should not add credits for users at max rollover', async ({ request }) => {
      const testUser = await resetTestUser();

      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
      await supabase
        .from('profiles')
        .update({
          stripe_customer_id: 'cus_test_max_rollover',
          credits_balance: 6000, // At pro plan max rollover
        })
        .eq('id', testUser.id);

      const { STRIPE_PRICES } = await import('@shared/config/stripe');

      const maxRolloverInvoice = {
        id: 'in_test_max_rollover',
        object: 'invoice',
        customer: 'cus_test_max_rollover',
        subscription: 'sub_test_max_rollover',
        status: 'paid',
        paid: true,
        lines: {
          data: [
            {
              price: {
                id: STRIPE_PRICES.PRO_MONTHLY, // Pro plan: 1000 credits/month, 6000 max rollover
              },
            },
          ],
        },
      };

      const response = await request.post('/api/webhooks/stripe', {
        data: maxRolloverInvoice,
        headers: { 'stripe-signature': 'test_signature' },
      });

      expect(response.status()).toBe(200);

      // Verify credits remain unchanged
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits_balance')
        .eq('id', testUser.id)
        .single();

      expect(profile!.credits_balance).toBe(6000); // Unchanged
    });
  });

  test.describe('invoice.payment_failed', () => {
    test('should mark subscription as past due', async ({ request }) => {
      const testUser = await resetTestUser();

      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
      await supabase
        .from('profiles')
        .update({
          stripe_customer_id: 'cus_test_payment_failed',
          subscription_status: 'active',
        })
        .eq('id', testUser.id);

      const failedPaymentInvoice = {
        id: 'in_test_payment_failed',
        object: 'invoice',
        customer: 'cus_test_payment_failed',
        status: 'open',
        paid: false,
        lines: { data: [{ price: { id: 'price_hobby_monthly' } }] },
      };

      const response = await request.post('/api/webhooks/stripe', {
        data: failedPaymentInvoice,
        headers: { 'stripe-signature': 'test_signature' },
      });

      expect(response.status()).toBe(200);

      // Verify profile was marked as past due
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', testUser.id)
        .single();

      expect(profile!.subscription_status).toBe('past_due');
    });
  });

  test.describe('Subscription-Only Guarantees', () => {
    test('should not process credit pack invoices', async ({ request }) => {
      const testUser = await resetTestUser();

      // Simulate a legacy credit pack invoice
      const creditPackInvoice = {
        id: 'in_test_credit_pack',
        object: 'invoice',
        customer: 'cus_test_credit_pack',
        status: 'paid',
        paid: true,
        lines: {
          data: [
            {
              price: {
                id: 'price_credit_pack_1000', // Credit pack price (not in subscription map)
              },
            },
          ],
        },
        metadata: {
          credits_amount: '1000', // Legacy credit pack metadata
        },
      };

      const response = await request.post('/api/webhooks/stripe', {
        data: creditPackInvoice,
        headers: { 'stripe-signature': 'test_signature' },
      });

      expect(response.status()).toBe(200);

      // Verify no credits were added
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits_balance')
        .eq('id', testUser.id)
        .single();

      expect(profile!.credits_balance).toBe(0); // No credits added
    });
  });
});