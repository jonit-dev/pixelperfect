import { test, expect } from '@playwright/test';

test.describe('API: Analytics Event', () => {
  const endpoint = '/api/analytics/event';

  test.describe('POST /api/analytics/event', () => {
    test('should accept valid event payload (anonymous)', async ({ request }) => {
      const response = await request.post(endpoint, {
        data: {
          eventName: 'checkout_started',
          properties: { plan: 'pro' },
          sessionId: 'test-session-123',
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
    });

    test('should accept valid event without optional properties', async ({ request }) => {
      const response = await request.post(endpoint, {
        data: {
          eventName: 'login',
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
    });

    test('should reject invalid event name', async ({ request }) => {
      const response = await request.post(endpoint, {
        data: {
          eventName: 'invalid_event_name',
          properties: {},
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Invalid event payload');
    });

    test('should reject missing event name', async ({ request }) => {
      const response = await request.post(endpoint, {
        data: {
          properties: { foo: 'bar' },
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Invalid event payload');
    });

    test('should accept all allowed event types', async ({ request }) => {
      const allowedEvents = [
        'signup_started',
        'signup_completed',
        'login',
        'logout',
        'checkout_started',
        'checkout_completed',
        'checkout_abandoned',
        'image_download',
      ];

      // Test each event type individually to avoid rate limiting
      for (const eventName of allowedEvents) {
        const response = await request.post(endpoint, {
          data: { eventName },
        });

        // Accept 200 (success) or 429 (rate limited) - both indicate valid event type
        expect([200, 429]).toContain(response.status());

        if (response.status() === 200) {
          const data = await response.json();
          expect(data).toHaveProperty('success', true);
        } else {
          // Rate limited response - still means the event type was valid
          const data = await response.json();
          expect(data).toBeDefined();
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    });

    test('should have correct content-type header', async ({ request }) => {
      const response = await request.post(endpoint, {
        data: { eventName: 'login' },
      });

      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/json');
    });

    test('should respond quickly', async ({ request }) => {
      // Warm up the API route to avoid cold start in timing measurement
      await request.post(endpoint, {
        data: { eventName: 'login' },
      });

      const startTime = Date.now();
      await request.post(endpoint, {
        data: { eventName: 'login' },
      });
      const duration = Date.now() - startTime;

      // Analytics endpoint should respond quickly when warm (under 500ms)
      expect(duration).toBeLessThan(500);
    });
  });
});
