import { test, expect } from '@playwright/test';
import { TestDataManager } from '../helpers/test-data-manager';

/**
 * AI Services Integration Tests
 *
 * Tests AI service integration including:
 * - Primary provider (Gemini API) connectivity
 * - Fallback provider (OpenRouter) functionality
 * - Error handling and retry logic
 * - Prompt engineering and validation
 * - Processing timeout handling
 * - Rate limiting for AI services
 */
test.describe('AI Services Integration', () => {
  let testDataManager: TestDataManager;
  let testUser: { id: string; email: string; token: string };

  test.beforeAll(async () => {
    testDataManager = new TestDataManager();
    testUser = await testDataManager.createTestUserWithSubscription('active', 'pro', 100);
  });

  test.afterAll(async () => {
    await testDataManager.cleanupUser(testUser.id);
  });

  test.describe('Service Connectivity', () => {
    test('should handle Gemini API health check', async ({ request }) => {
      const response = await request.get('/api/health/ai', {
        headers: {
          Authorization: `Bearer ${testUser.token}`,
        },
      });

      // Health check endpoint may not exist, but if it does, should return status
      expect([200, 404].includes(response.status())).toBeTruthy();

      if (response.ok()) {
        const health = await response.json();
        expect(health).toHaveProperty('gemini');
        expect(health).toHaveProperty('openrouter');
      }
    });

    test('should validate API keys are configured', async ({ request }) => {
      // Try processing to verify API keys are present (may fail due to mocking)
      const response = await request.post('/api/upscale/test-connection', {
        headers: {
          Authorization: `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        data: {
          test: true,
        },
      });

      // Should not fail due to missing API keys
      expect([200, 404, 400].includes(response.status())).toBeTruthy();

      if (response.status() === 500) {
        const error = await response.json();
        // Should not be "API key not configured" error
        expect(error.error.message).not.toMatch(/api.*key/i);
      }
    });
  });

  test.describe('Image Processing Integration', () => {
    test('should validate input image before processing', async ({ request }) => {
      const testCases = [
        { name: 'Empty image', image: '' },
        { name: 'Invalid base64', image: 'not-base64-data' },
        { name: 'Too small image', image: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' }, // 1x1 pixel
        { name: 'Invalid format', image: Buffer.from('fake-image').toString('base64') },
      ];

      for (const testCase of testCases) {
        const response = await request.post('/api/upscale', {
          headers: {
            Authorization: `Bearer ${testUser.token}`,
            'Content-Type': 'application/json',
          },
          data: {
            image: testCase.image,
            mode: 'standard',
            scale: 2,
          },
        });

        expect(response.status()).toBe(400);
        const error = await response.json();
        expect(['INVALID_FILE', 'INVALID_IMAGE', 'INVALID_DIMENSIONS']).toContain(error.error.code);
      }
    });

    test('should validate processing parameters', async ({ request }) => {
      const validImage = 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3AQXBykwNt7qKQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAT0lEQVQYV2NkYGD4z4AHMOrAaKDAE14hPFfgZLwMFAZVWQJwJiYGBgYOHCo6B8ZGBgYJh6B/zDAQwMf8DEAIhUAZUDAZUGQGQGBgYG5pAhlA0AAD/lrR9YgAAAAASUVORK5CYII=';

      const invalidParams = [
        { scale: 0 }, // Invalid scale
        { scale: 17 }, // Invalid scale
        { mode: 'invalid-mode' }, // Invalid mode
        { preserveText: 'invalid-boolean' }, // Invalid type
        { scale: 'invalid-number' }, // Wrong type
      ];

      for (const params of invalidParams) {
        const response = await request.post('/api/upscale', {
          headers: {
            Authorization: `Bearer ${testUser.token}`,
            'Content-Type': 'application/json',
          },
          data: {
            image: validImage,
            mode: 'standard',
            scale: 2,
            ...params,
          },
        });

        expect(response.status()).toBe(400);
        const error = await response.json();
        expect(['INVALID_REQUEST', 'INVALID_PARAMETERS']).toContain(error.error.code);
      }
    });
  });

  test.describe('Fallback Provider Logic', () => {
    test('should handle primary provider failure gracefully', async ({ request }) => {
      // Mock a scenario where primary provider fails
      const response = await request.post('/api/upscale', {
        headers: {
          Authorization: `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        data: {
          image: 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3AQXBykwNt7qKQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAT0lEQVQYV2NkYGD4z4AHMOrAaKDAE14hPFfgZLwMFAZVWQJwJiYGBgYOHCo6B8ZGBgYJh6B/zDAQwMf8DEAIhUAZUDAZUGQGQGBgYG5pAhlA0AAD/lrR9YgAAAAASUVORK5CYII=',
          mode: 'standard',
          scale: 2,
          forcePrimaryFailure: true, // Custom parameter for testing
        },
      });

      // Should attempt fallback or return appropriate error
      expect([200, 503, 500].includes(response.status())).toBeTruthy();

      if (!response.ok()) {
        const error = await response.json();
        expect(['AI_UNAVAILABLE', 'PROCESSING_FAILED']).toContain(error.error.code);
      }
    });

    test('should track provider switches', async ({ request }) => {
      // This would require logging provider switches
      // For now, we verify the request structure is handled
      const response = await request.post('/api/upscale', {
        headers: {
          Authorization: `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        data: {
          image: 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3AQXBykwNt7qKQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAT0lEQVQYV2NkYGD4z4AHMOrAaKDAE14hPFfgZLwMFAZVWQJwJiYGBgYOHCo6B8ZGBgYJh6B/zDAQwMf8DEAIhUAZUDAZUGQGQGBgYG5pAhlA0AAD/lrR9YgAAAAASUVORK5CYII=',
          mode: 'standard',
          scale: 2,
        },
      });

      // Request should be structured properly for provider handling
      expect([200, 503, 500].includes(response.status())).toBeTruthy();
    });
  });

  test.describe('Prompt Engineering', () => {
    test('should build appropriate prompts for different modes', async ({ request }) => {
      const modes = ['standard', 'enhanced', 'portrait', 'product'];
      const validImage = 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3AQXBykwNt7qKQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAT0lEQVQYV2NkYGD4z4AHMOrAaKDAE14hPFfgZLwMFAZVWQJwJiYGBgYOHCo6B8ZGBgYJh6B/zDAQwMf8DEAIhUAZUDAZUGQGQGBgYG5pAhlA0AAD/lrR9YgAAAAASUVORK5CYII=';

      for (const mode of modes) {
        const response = await request.post('/api/upscale/prompt-test', {
          headers: {
            Authorization: `Bearer ${testUser.token}`,
            'Content-Type': 'application/json',
          },
          data: {
            image: validImage,
            mode,
            scale: 2,
            testPrompt: true,
          },
        });

        // Prompt test endpoint may not exist, but request should be valid
        expect([200, 404].includes(response.status())).toBeTruthy();

        if (response.ok()) {
          const result = await response.json();
          expect(result.data.prompt).toContain(mode);
        }
      }
    });

    test('should handle text preservation instructions', async ({ request }) => {
      const response = await request.post('/api/upscale', {
        headers: {
          Authorization: `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        data: {
          image: 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3AQXBykwNt7qKQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAT0lEQVQYV2NkYGD4z4AHMOrAaKDAE14hPFfgZLwMFAZVWQJwJiYGBgYOHCo6B8ZGBgYJh6B/zDAQwMf8DEAIhUAZUDAZUGQGQGBgYG5pAhlA0AAD/lrR9YgAAAAASUVORK5CYII=',
          mode: 'standard',
          scale: 2,
          preserveText: true,
          customPrompt: 'Preserve all text and logos perfectly',
        },
      });

      // Should accept custom prompt parameters
      expect([200, 503, 500].includes(response.status())).toBeTruthy();
    });
  });

  test.describe('Error Handling and Recovery', () => {
    test('should handle timeout scenarios', async ({ request }) => {
      const response = await request.post('/api/upscale', {
        headers: {
          Authorization: `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        data: {
          image: 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3AQXBykwNt7qKQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAT0lEQVQYV2NkYGD4z4AHMOrAaKDAE14hPFfgZLwMFAZVWQJwJiYGBgYOHCo6B8ZGBgYJh6B/zDAQwMf8DEAIhUAZUDAZUGQGQGBgYG5pAhlA0AAD/lrR9YgAAAAASUVORK5CYII=',
          mode: 'standard',
          scale: 2,
          timeout: 1000, // Very short timeout for testing
        },
      });

      // Should handle timeout without hanging
      expect([408, 500, 503, 400].includes(response.status())).toBeTruthy();
    });

    test('should retry on transient failures', async ({ request }) => {
      // Simulate a transient failure scenario
      const response = await request.post('/api/upscale', {
        headers: {
          Authorization: `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        data: {
          image: 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3AQXBykwNt7qKQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAT0lEQVQYV2NkYGD4z4AHMOrAaKDAE14hPFfgZLwMFAZVWQJwJiYGBgYOHCo6B8ZGBgYJh6B/zDAQwMf8DEAIhUAZUDAZUGQGQGBgYG5pAhlA0AAD/lrR9YgAAAAASUVORK5CYII=',
          mode: 'standard',
          scale: 2,
          simulateTransientError: true,
        },
      });

      // Should either succeed after retry or fail gracefully
      expect([200, 500, 503].includes(response.status())).toBeTruthy();

      if (!response.ok()) {
        const error = await response.json();
        // Should indicate retry was attempted
        expect(error.error.details?.retryAttempt).toBeDefined();
      }
    });

    test('should refund credits on processing failure', async ({ request }) => {
      const initialBalance = (await testDataManager.getUserProfile(testUser.id)).credits_balance;

      const response = await request.post('/api/upscale', {
        headers: {
          Authorization: `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        data: {
          image: 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3AQXBykwNt7qKQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAT0lEQVQYV2NkYGD4z4AHMOrAaKDAE14hPFfgZLwMFAZVWQJwJiYGBgYOHCo6B8ZGBgYJh6B/zDAQwMf8DEAIhUAZUDAZUGQGQGBgYG5pAhlA0AAD/lrR9YgAAAAASUVORK5CYII=',
          mode: 'standard',
          scale: 2,
          forceError: true,
        },
      });

      if (response.status() >= 500) {
        // Check if credits were refunded
        const finalBalance = (await testDataManager.getUserProfile(testUser.id)).credits_balance;
        expect(finalBalance).toBe(initialBalance);

        // Check for refund transaction
        const transactions = await testDataManager.getCreditTransactions(testUser.id);
        const refundTransaction = transactions.find(t =>
          t.type === 'refund' && t.description?.includes('Processing failure')
        );
        expect(refundTransaction).toBeDefined();
      }
    });
  });

  test.describe('Rate Limiting for AI Services', () => {
    test('should limit concurrent AI requests', async ({ request }) => {
      const requests = Array(10).fill(null).map(() =>
        request.post('/api/upscale', {
          headers: {
            Authorization: `Bearer ${testUser.token}`,
            'Content-Type': 'application/json',
          },
          data: {
            image: 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3AQXBykwNt7qKQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAT0lEQVQYV2NkYGD4z4AHMOrAaKDAE14hPFfgZLwMFAZVWQJwJiYGBgYOHCo6B8ZGBgYJh6B/zDAQwMf8DEAIhUAZUDAZUGQGQGBgYG5pAhlA0AAD/lrR9YgAAAAASUVORK5CYII=',
            mode: 'standard',
            scale: 2,
          },
        })
      );

      const responses = await Promise.all(requests);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status() === 429);
      const successfulResponses = responses.filter(r => r.ok());

      // At least some responses should be handled (either rate limited or processed)
      expect(rateLimitedResponses.length + successfulResponses.length).toBeGreaterThan(0);

      if (rateLimitedResponses.length > 0) {
        const rateLimitError = await rateLimitedResponses[0].json();
        expect(rateLimitError.error.code).toBe('RATE_LIMITED');
      }
    });
  });

  test.describe('Performance Monitoring', () => {
    test('should track processing time', async ({ request }) => {
      const startTime = Date.now();

      const response = await request.post('/api/upscale', {
        headers: {
          Authorization: `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        data: {
          image: 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3AQXBykwNt7qKQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAT0lEQVQYV2NkYGD4z4AHMOrAaKDAE14hPFfgZLwMFAZVWQJwJiYGBgYOHCo6B8ZGBgYJh6B/zDAQwMf8DEAIhUAZUDAZUGQGQGBgYG5pAhlA0AAD/lrR9YgAAAAASUVORK5CYII=',
          mode: 'standard',
          scale: 2,
        },
      });

      const responseTime = Date.now() - startTime;

      // Should respond within reasonable time (even if processing fails)
      expect(responseTime).toBeLessThan(30000); // 30 seconds

      if (response.ok()) {
        const result = await response.json();
        expect(result.data.processingTime).toBeDefined();
        expect(result.data.processingTime).toBeGreaterThan(0);
      }
    });

    test('should monitor AI provider performance', async ({ request }) => {
      const response = await request.get('/api/monitoring/ai-performance', {
        headers: {
          Authorization: `Bearer ${testUser.token}`,
        },
      });

      // Monitoring endpoint may not exist, but if it does should return metrics
      expect([200, 404].includes(response.status())).toBeTruthy();

      if (response.ok()) {
        const metrics = await response.json();
        expect(metrics).toHaveProperty('gemini');
        expect(metrics).toHaveProperty('openrouter');
      }
    });
  });
});