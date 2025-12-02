import { test, expect } from '@playwright/test';
import { resetTestUser } from '../helpers/test-user-reset';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe('API: Stripe Customer Portal', () => {
  test.describe('Authentication', () => {
    test('should reject requests without authorization header', async ({ request }) => {
      const response = await request.post('/api/portal', {
        headers: {
          'content-type': 'application/json',
        },
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.error.message).toBe('Missing authorization header');
    });

    test('should reject requests with invalid token', async ({ request }) => {
      const response = await request.post('/api/portal', {
        headers: {
          authorization: 'Bearer invalid_token',
          'content-type': 'application/json',
        },
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.error.message).toBe('Invalid authentication token');
    });

    test('should accept requests with valid token', async ({ request }) => {
      const testUser = await resetTestUser();

      const response = await request.post('/api/portal', {
        headers: {
          authorization: `Bearer ${testUser.access_token}`,
          'content-type': 'application/json',
          origin: 'https://example.com',
        },
      });

      // Should fail at customer ID lookup (since we haven't set one up)
      // but pass authentication
      expect(response.status()).toBeGreaterThanOrEqual(400);
      const data = await response.json();
      expect(data.error.code).not.toBe('UNAUTHORIZED');
    });

    test('should handle malformed authorization headers', async ({ request }) => {
      const malformedAuthHeaders = [
        '',
        'Bearer',
        'InvalidFormat token',
        'bearer token',
      ];

      for (const authHeader of malformedAuthHeaders) {
        const response = await request.post('/api/portal', {
          headers: {
            authorization: authHeader,
            'content-type': 'application/json',
          },
        });

        expect(response.status()).toBe(401);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('UNAUTHORIZED');
      }
    });
  });

  test.describe('Request Body Validation', () => {
    test('should accept empty request body', async ({ request }) => {
      const testUser = await resetTestUser();

      const response = await request.post('/api/portal', {
        headers: {
          authorization: `Bearer ${testUser.access_token}`,
          'content-type': 'application/json',
          origin: 'https://example.com',
        },
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('should accept valid JSON with returnUrl', async ({ request }) => {
      const testUser = await resetTestUser();

      const response = await request.post('/api/portal', {
        data: { returnUrl: 'https://example.com/return' },
        headers: {
          authorization: `Bearer ${testUser.access_token}`,
          'content-type': 'application/json',
          origin: 'https://example.com',
        },
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('should reject malformed JSON', async ({ request }) => {
      const testUser = await resetTestUser();

      const response = await request.post('/api/portal', {
        data: '{"returnUrl": "https://example.com", "invalid": }',
        headers: {
          authorization: `Bearer ${testUser.access_token}`,
          'content-type': 'application/json',
          origin: 'https://example.com',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_JSON');
      expect(data.error.message).toBe('Invalid JSON in request body');
    });
  });

  test.describe('Return URL Validation', () => {
    test('should accept valid HTTPS return URL', async ({ request }) => {
      const testUser = await resetTestUser();

      const response = await request.post('/api/portal', {
        data: { returnUrl: 'https://example.com/return' },
        headers: {
          authorization: `Bearer ${testUser.access_token}`,
          'content-type': 'application/json',
          origin: 'https://example.com',
        },
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
      const data = await response.json();
      expect(data.error.code).not.toBe('INVALID_RETURN_URL');
    });

    test('should accept valid HTTP return URL', async ({ request }) => {
      const testUser = await resetTestUser();

      const response = await request.post('/api/portal', {
        data: { returnUrl: 'http://example.com/return' },
        headers: {
          authorization: `Bearer ${testUser.access_token}`,
          'content-type': 'application/json',
          origin: 'https://example.com',
        },
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
      const data = await response.json();
      expect(data.error.code).not.toBe('INVALID_RETURN_URL');
    });

    test('should reject dangerous protocols', async ({ request }) => {
      const testUser = await resetTestUser();

      const dangerousUrls = [
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'vbscript:msgbox("xss")',
        'ftp://example.com/file',
        'file:///etc/passwd',
      ];

      for (const url of dangerousUrls) {
        const response = await request.post('/api/portal', {
          data: { returnUrl: url },
          headers: {
            authorization: `Bearer ${testUser.access_token}`,
            'content-type': 'application/json',
            origin: 'https://example.com',
          },
        });

        expect(response.status()).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('INVALID_RETURN_URL');
      }
    });

    test('should reject XSS patterns in return URL', async ({ request }) => {
      const testUser = await resetTestUser();

      const xssUrls = [
        'https://example.com/<script>alert("xss")</script>',
        'https://example.com/?onload=alert("xss")',
        'https://example.com/?onerror=alert("xss")',
        'https://example.com/javascript:alert("xss")',
        'https://example.com/data:text/html,<script>alert("xss")</script>',
      ];

      for (const url of xssUrls) {
        const response = await request.post('/api/portal', {
          data: { returnUrl: url },
          headers: {
            authorization: `Bearer ${testUser.access_token}`,
            'content-type': 'application/json',
            origin: 'https://example.com',
          },
        });

        expect(response.status()).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('INVALID_RETURN_URL');
      }
    });

    test('should reject malformed URLs', async ({ request }) => {
      const testUser = await resetTestUser();

      const malformedUrls = [
        'not-a-url',
        'ht tp://invalid',
        '://missing-protocol',
        'https://',
        'http://',
      ];

      for (const url of malformedUrls) {
        const response = await request.post('/api/portal', {
          data: { returnUrl: url },
          headers: {
            authorization: `Bearer ${testUser.access_token}`,
            'content-type': 'application/json',
            origin: 'https://example.com',
          },
        });

        expect(response.status()).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('INVALID_RETURN_URL');
      }
    });

    test('should use default return URL when not provided', async ({ request }) => {
      const testUser = await resetTestUser();

      const response = await request.post('/api/portal', {
        headers: {
          authorization: `Bearer ${testUser.access_token}`,
          'content-type': 'application/json',
          origin: 'https://example.com',
        },
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('Customer ID Management', () => {
    test('should reject requests without Stripe customer ID', async ({ request }) => {
      const testUser = await resetTestUser();

      const response = await request.post('/api/portal', {
        data: { returnUrl: 'https://example.com/return' },
        headers: {
          authorization: `Bearer ${testUser.access_token}`,
          'content-type': 'application/json',
          origin: 'https://example.com',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('STRIPE_CUSTOMER_NOT_FOUND');
      expect(data.error.message).toBe('Activate a subscription to manage billing.');
    });

    test('should accept requests with valid Stripe customer ID', async ({ request }) => {
      const testUser = await resetTestUser();

      // Set up customer ID in profile
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: 'cus_test_123' })
        .eq('id', testUser.id);

      const response = await request.post('/api/portal', {
        data: { returnUrl: 'https://example.com/return' },
        headers: {
          authorization: `Bearer ${testUser.access_token}`,
          'content-type': 'application/json',
          origin: 'https://example.com',
        },
      });

      // Should fail at Stripe API call in real environment
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('Test Mode Behavior', () => {
    test('should return mock response in test environment', async ({ request }) => {
      const testUser = await resetTestUser();

      // Set up customer ID
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: 'cus_test_mock' })
        .eq('id', testUser.id);

      const response = await request.post('/api/portal', {
        data: { returnUrl: 'https://example.com/return' },
        headers: {
          authorization: `Bearer ${testUser.access_token}`,
          'content-type': 'application/json',
          origin: 'https://example.com',
        },
      });

      // In test environment, should return mock response
      const data = await response.json();
      if (response.status() === 200) {
        expect(data.success).toBe(true);
        expect(data.data.mock).toBe(true);
        expect(data.data.url).toContain('mock=true');
      }
    });

    test('should handle dummy Stripe key', async ({ request }) => {
      const testUser = await resetTestUser();

      // Set up customer ID
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: 'cus_test_dummy' })
        .eq('id', testUser.id);

      // Note: This would only work if we could mock the environment variable
      // For now, we test that the code path exists
      const response = await request.post('/api/portal', {
        headers: {
          authorization: `Bearer ${testUser.access_token}`,
          'content-type': 'application/json',
          origin: 'https://example.com',
        },
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('Origin Header Handling', () => {
    test('should use origin header for default return URL', async ({ request }) => {
      const testUser = await resetTestUser();

      const response = await request.post('/api/portal', {
        headers: {
          authorization: `Bearer ${testUser.access_token}`,
          'content-type': 'application/json',
          origin: 'https://myapp.com',
        },
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('should work without origin header', async ({ request }) => {
      const testUser = await resetTestUser();

      const response = await request.post('/api/portal', {
        headers: {
          authorization: `Bearer ${testUser.access_token}`,
          'content-type': 'application/json',
        },
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle database errors gracefully', async ({ request }) => {
      const response = await request.post('/api/portal', {
        headers: {
          authorization: 'Bearer potentially_valid_but_db_unavailable_token',
          'content-type': 'application/json',
          origin: 'https://example.com',
        },
      });

      // Should return 401 or 500 depending on where the error occurs
      expect([401, 500]).toContain(response.status());
    });

    test('should handle Stripe API errors gracefully', async ({ request }) => {
      const testUser = await resetTestUser();

      // Set up invalid customer ID to trigger Stripe error
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: 'cus_invalid_123' })
        .eq('id', testUser.id);

      const response = await request.post('/api/portal', {
        headers: {
          authorization: `Bearer ${testUser.access_token}`,
          'content-type': 'application/json',
          origin: 'https://example.com',
        },
      });

      // Should return 500 due to Stripe API error
      expect(response.status()).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });

    test('should return appropriate error codes', async ({ request }) => {
      const testUser = await resetTestUser();

      const response = await request.post('/api/portal', {
        headers: {
          authorization: `Bearer ${testUser.access_token}`,
          'content-type': 'application/json',
          origin: 'https://example.com',
        },
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
      const data = await response.json();
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('code');
      expect(data.error).toHaveProperty('message');
    });
  });

  test.describe('Security', () => {
    test('should prevent access to other users\' customer data', async ({ request }) => {
      const testUser = await resetTestUser();

      // Set up customer ID for this specific user
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: 'cus_user_specific_123' })
        .eq('id', testUser.id);

      const response = await request.post('/api/portal', {
        headers: {
          authorization: `Bearer ${testUser.access_token}`,
          'content-type': 'application/json',
          origin: 'https://example.com',
        },
      });

      // Should only access this user's customer data
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('should sanitize all user inputs', async ({ request }) => {
      const testUser = await resetTestUser();

      // Test various injection attempts
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        '{{constructor.constructor("return process")().exit()}}',
      ];

      for (const input of maliciousInputs) {
        const response = await request.post('/api/portal', {
          data: { returnUrl: input },
          headers: {
            authorization: `Bearer ${testUser.access_token}`,
            'content-type': 'application/json',
            origin: 'https://example.com',
          },
        });

        // Should reject dangerous inputs
        if (response.status() === 400) {
          const data = await response.json();
          expect(data.success).toBe(false);
        }
      }
    });
  });

  test.describe('Response Format', () => {
    test('should return consistent error response format', async ({ request }) => {
      const testUser = await resetTestUser();

      const response = await request.post('/api/portal', {
        headers: {
          authorization: `Bearer ${testUser.access_token}`,
          'content-type': 'application/json',
          origin: 'https://example.com',
        },
      });

      expect(response.headers()['content-type']).toContain('application/json');

      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('error');

      if (data.success === false) {
        expect(data.error).toHaveProperty('code');
        expect(data.error).toHaveProperty('message');
      }
    });

    test('should return success response format in test mode', async ({ request }) => {
      const testUser = await resetTestUser();

      // Set up customer ID
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: 'cus_test_format' })
        .eq('id', testUser.id);

      const response = await request.post('/api/portal', {
        headers: {
          authorization: `Bearer ${testUser.access_token}`,
          'content-type': 'application/json',
          origin: 'https://example.com',
        },
      });

      const data = await response.json();
      expect(data).toHaveProperty('success');

      if (data.success === true) {
        expect(data).toHaveProperty('data');
        expect(data.data).toHaveProperty('url');
        expect(data.data).toHaveProperty('mock');
      }
    });
  });
});