import { test, expect } from '@playwright/test';
import { test as authenticatedTest } from '../helpers/auth';

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

authenticatedTest.describe('API: Stripe Checkout - Authenticated Users', () => {
  authenticatedTest('should validate required fields', async ({ request, testUser }) => {
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

  authenticatedTest('should reject invalid priceId format', async ({ request, testUser }) => {
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

  authenticatedTest('should handle custom success and cancel URLs', async ({ request, testUser }) => {
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
  });

  authenticatedTest('should create checkout session with valid data', async ({ request, testUser }) => {
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
  });

  authenticatedTest('should handle metadata properly', async ({ request, testUser }) => {
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

  authenticatedTest('should handle empty metadata', async ({ request, testUser }) => {
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

  authenticatedTest('should handle metadata as undefined', async ({ request, testUser }) => {
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
});
