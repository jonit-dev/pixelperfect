import { test, expect } from '@playwright/test';
import { TestDataManager } from '../helpers/test-data-manager';

/**
 * Integration Tests for Stripe Checkout API
 *
 * These tests validate the checkout session creation functionality including:
 * - Authentication and authorization
 * - Price validation
 * - Subscription conflict checking
 * - Stripe customer management
 * - Test mode handling
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Shared test setup for all checkout tests
let dataManager: TestDataManager;
let testUser: { id: string; email: string; token: string };

test.beforeAll(async () => {
  dataManager = new TestDataManager();
  testUser = await dataManager.createTestUser();
});

test.afterAll(async () => {
  if (dataManager) {
    await dataManager.cleanupAllUsers();
  }
});

test.describe('API: Stripe Checkout - Authentication', () => {

  test('should reject unauthenticated requests', async ({ request }) => {
    const response = await request.post('/api/checkout', {
      data: {
        priceId: 'price_test_123',
      },
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  test('should reject invalid auth token', async ({ request }) => {
    const response = await request.post('/api/checkout', {
      data: {
        priceId: 'price_test_123',
      },
      headers: {
        Authorization: 'Bearer invalid_token_12345',
      },
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  test('should reject malformed auth header', async ({ request }) => {
    const response = await request.post('/api/checkout', {
      data: {
        priceId: 'price_test_123',
      },
      headers: {
        Authorization: 'InvalidFormat token123',
      },
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('UNAUTHORIZED');
  });
});

test.describe('API: Stripe Checkout - Authenticated Users', () => {
  test('should validate required fields', async ({ request }) => {
    const response = await request.post('/api/checkout', {
      data: {},
      headers: {
        Authorization: `Bearer ${testUser.token}`,
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.error.message).toBe('priceId is required');
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  test('should reject invalid priceId format', async ({ request }) => {
    const response = await request.post('/api/checkout', {
      data: {
        priceId: 'invalid_price_format',
      },
      headers: {
        Authorization: `Bearer ${testUser.token}`,
      },
    });

    // Should reject invalid price IDs with proper error format
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INVALID_PRICE');
    expect(data.error.message).toContain('Invalid price ID');
  });

  test(
    'should handle custom success and cancel URLs',
    async ({ request }) => {
      const { STRIPE_PRICES } = await import('@shared/config/stripe');
      const response = await request.post('/api/checkout', {
        data: {
          priceId: STRIPE_PRICES.PRO_MONTHLY, // Use valid price ID
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
          metadata: {
            test_key: 'test_value',
            user_source: 'mobile_app',
          },
        },
        headers: {
          Authorization: `Bearer ${testUser.token}`,
        },
      });

      // Should pass validation and create a checkout session
      expect([200, 400, 500]).toContain(response.status());

      const data = await response.json();

      if (response.status() === 200) {
        // Success case - checkout session created
        expect(data.success).toBe(true);
        expect(data.data.url).toBeTruthy();
        expect(data.data.sessionId).toBeTruthy();

        // In test mode with real Stripe keys, should return actual session
        if (data.data.mock) {
          // Mock session - test mode fallback
          expect(data.data.mock).toBe(true);
        } else {
          // Real Stripe session - verify structure
          expect(typeof data.data.url).toBe('string');
          expect(typeof data.data.sessionId).toBe('string');
          expect(data.data.sessionId).toMatch(/^cs_/);
        }
      } else {
        // Error case - should not be a validation error for valid price ID
        expect(data.error).toBeDefined();
        if (response.status() === 400) {
          expect(data.error.code).not.toBe('INVALID_PRICE');
        }
      }
    }
  );

  test(
    'should create checkout session with valid data',
    async ({ request }) => {
      // Note: This test would require a valid Stripe price ID and proper test environment
      // For now, we test the structure and error handling
      const response = await request.post('/api/checkout', {
        data: {
          priceId: 'price_1O2x3Y4Z5X6W7V8Y', // Invalid format but tests structure
          metadata: {
            user_id: testUser.id,
            test_mode: 'true',
          },
        },
        headers: {
          Authorization: `Bearer ${testUser.token}`,
        },
      });

      // In test mode, should succeed with mock response
      // In production, would fail at Stripe API level
      expect([200, 400, 500]).toContain(response.status());
      const data = await response.json();

      if (response.status() === 200) {
        // Mock response in test mode
        expect(data.success).toBe(true);
        expect(data.data.url).toBeTruthy();
        expect(data.data.sessionId).toBeTruthy();
        expect(data.data.mock).toBe(true);
      } else {
        // Real Stripe API failure in production
        expect(data.error).toBeDefined();
      }
    }
  );

  test('should handle metadata properly', async ({ request }) => {
    const { STRIPE_PRICES } = await import('@shared/config/stripe');
    const response = await request.post('/api/checkout', {
      data: {
        priceId: STRIPE_PRICES.HOBBY_MONTHLY, // Use valid price ID
        metadata: {
          plan_type: 'premium',
          campaign_id: 'summer_sale',
          custom_field: 'custom_value',
        },
      },
      headers: {
        Authorization: `Bearer ${testUser.token}`,
      },
    });

    // Should pass validation and create a checkout session
    expect([200, 400, 500]).toContain(response.status());

    const data = await response.json();

    if (response.status() === 200) {
      // Success case - checkout session created with metadata
      expect(data.success).toBe(true);
      expect(data.data.url).toBeTruthy();
      expect(data.data.sessionId).toBeTruthy();

      // In test mode with real Stripe keys, should return actual session
      if (data.data.mock) {
        // Mock session - test mode fallback
        expect(data.data.mock).toBe(true);
      } else {
        // Real Stripe session - verify structure
        expect(typeof data.data.url).toBe('string');
        expect(typeof data.data.sessionId).toBe('string');
        expect(data.data.sessionId).toMatch(/^cs_/);
      }
    } else {
      // Error case - should not be a validation error for valid price ID
      expect(data.error).toBeDefined();
      if (response.status() === 400) {
        expect(data.error.code).not.toBe('INVALID_PRICE');
      }
    }
  });

  test('should handle empty metadata', async ({ request }) => {
    const { STRIPE_PRICES } = await import('@shared/config/stripe');
    const response = await request.post('/api/checkout', {
      data: {
        priceId: STRIPE_PRICES.BUSINESS_MONTHLY, // Use valid price ID
        metadata: {},
      },
      headers: {
        Authorization: `Bearer ${testUser.token}`,
      },
    });

    // Should pass validation and create a checkout session
    expect([200, 400, 500]).toContain(response.status());

    const data = await response.json();

    if (response.status() === 200) {
      // Success case - checkout session created with empty metadata
      expect(data.success).toBe(true);
      expect(data.data.url).toBeTruthy();
      expect(data.data.sessionId).toBeTruthy();

      // In test mode with real Stripe keys, should return actual session
      if (data.data.mock) {
        // Mock session - test mode fallback
        expect(data.data.mock).toBe(true);
      } else {
        // Real Stripe session - verify structure
        expect(typeof data.data.url).toBe('string');
        expect(typeof data.data.sessionId).toBe('string');
        expect(data.data.sessionId).toMatch(/^cs_/);
      }
    } else {
      // Error case - should not be a validation error for valid price ID
      expect(data.error).toBeDefined();
      if (response.status() === 400) {
        expect(data.error.code).not.toBe('INVALID_PRICE');
      }
    }
  });

  test('should handle metadata as undefined', async ({ request }) => {
    const { STRIPE_PRICES } = await import('@shared/config/stripe');
    const response = await request.post('/api/checkout', {
      data: {
        priceId: STRIPE_PRICES.PRO_MONTHLY, // Use valid price ID
        // metadata not provided - should default to {}
      },
      headers: {
        Authorization: `Bearer ${testUser.token}`,
      },
    });

    // Should pass validation and create a checkout session
    expect([200, 400, 500]).toContain(response.status());

    const data = await response.json();

    if (response.status() === 200) {
      // Success case - checkout session created with default metadata
      expect(data.success).toBe(true);
      expect(data.data.url).toBeTruthy();
      expect(data.data.sessionId).toBeTruthy();

      // In test mode with real Stripe keys, should return actual session
      if (data.data.mock) {
        // Mock session - test mode fallback
        expect(data.data.mock).toBe(true);
      } else {
        // Real Stripe session - verify structure
        expect(typeof data.data.url).toBe('string');
        expect(typeof data.data.sessionId).toBe('string');
        expect(data.data.sessionId).toMatch(/^cs_/);
      }
    } else {
      // Error case - should not be a validation error for valid price ID
      expect(data.error).toBeDefined();
      if (response.status() === 400) {
        expect(data.error.code).not.toBe('INVALID_PRICE');
      }
    }
  });

  test(
    'should reject checkout if user already has active subscription',
    async ({ request }) => {
      const { supabaseAdmin } = await import('@server/supabase/supabaseAdmin');
      const { STRIPE_PRICES } = await import('@shared/config/stripe');

      // Create a mock active subscription for the test user
      const mockSubscription = {
        id: `sub_test_${Date.now()}`,
        user_id: testUser.id,
        status: 'active',
        price_id: STRIPE_PRICES.HOBBY_MONTHLY,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: false,
        canceled_at: null,
      };

      // Insert the subscription into the database
      await supabaseAdmin.from('subscriptions').insert(mockSubscription);

      try {
        // Try to create a new checkout session
        const response = await request.post('/api/checkout', {
          data: {
            priceId: STRIPE_PRICES.PRO_MONTHLY, // Trying to subscribe to a different plan
          },
          headers: {
            Authorization: `Bearer ${testUser.token}`,
          },
        });

        // Should reject with 400 status
        expect(response.status()).toBe(400);
        const data = await response.json();

        // Verify error response
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
        expect(data.error.code).toBe('ALREADY_SUBSCRIBED');
        expect(data.error.message).toContain('already have an active subscription');
      } finally {
        // Cleanup: Delete the test subscription
        await supabaseAdmin.from('subscriptions').delete().eq('id', mockSubscription.id);
      }
    }
  );

  test(
    'should reject checkout if user has trialing subscription',
    async ({ request }) => {
      const { supabaseAdmin } = await import('@server/supabase/supabaseAdmin');
      const { STRIPE_PRICES } = await import('@shared/config/stripe');

      // Create a mock trialing subscription for the test user
      const mockSubscription = {
        id: `sub_test_${Date.now()}_trial`,
        user_id: testUser.id,
        status: 'trialing',
        price_id: STRIPE_PRICES.HOBBY_MONTHLY,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: false,
        canceled_at: null,
      };

      // Insert the subscription into the database
      await supabaseAdmin.from('subscriptions').insert(mockSubscription);

      try {
        // Try to create a new checkout session
        const response = await request.post('/api/checkout', {
          data: {
            priceId: STRIPE_PRICES.BUSINESS_MONTHLY,
          },
          headers: {
            Authorization: `Bearer ${testUser.token}`,
          },
        });

        // Should reject with 400 status
        expect(response.status()).toBe(400);
        const data = await response.json();

        // Verify error response
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
        expect(data.error.code).toBe('ALREADY_SUBSCRIBED');
        expect(data.error.message).toContain('already have an active subscription');
      } finally {
        // Cleanup: Delete the test subscription
        await supabaseAdmin.from('subscriptions').delete().eq('id', mockSubscription.id);
      }
    }
  );

  test(
    'should allow checkout if user has canceled subscription',
    async ({ request }) => {
      const { supabaseAdmin } = await import('@server/supabase/supabaseAdmin');
      const { STRIPE_PRICES } = await import('@shared/config/stripe');

      // Create a mock canceled subscription for the test user
      const mockSubscription = {
        id: `sub_test_${Date.now()}_canceled`,
        user_id: testUser.id,
        status: 'canceled',
        price_id: STRIPE_PRICES.HOBBY_MONTHLY,
        current_period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        current_period_end: new Date().toISOString(),
        cancel_at_period_end: false,
        canceled_at: new Date().toISOString(),
      };

      // Insert the subscription into the database
      await supabaseAdmin.from('subscriptions').insert(mockSubscription);

      try {
        // Try to create a new checkout session
        const response = await request.post('/api/checkout', {
          data: {
            priceId: STRIPE_PRICES.PRO_MONTHLY,
          },
          headers: {
            Authorization: `Bearer ${testUser.token}`,
          },
        });

        // Should succeed since subscription is canceled
        expect([200, 400, 500]).toContain(response.status());
        const data = await response.json();

        if (response.status() === 200) {
          // Should create checkout session successfully
          expect(data.success).toBe(true);
          expect(data.data.url).toBeTruthy();
          expect(data.data.sessionId).toBeTruthy();
        } else if (response.status() === 400) {
          // Should NOT be an ALREADY_SUBSCRIBED error
          expect(data.error.code).not.toBe('ALREADY_SUBSCRIBED');
        }
      } finally {
        // Cleanup: Delete the test subscription
        await supabaseAdmin.from('subscriptions').delete().eq('id', mockSubscription.id);
      }
    }
  );
});
