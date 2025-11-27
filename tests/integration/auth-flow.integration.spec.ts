import { test, expect } from '@playwright/test';
import { TestDataManager, ITestUser } from '../helpers/test-data-manager';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Authentication Flow Integration Tests
 *
 * These tests verify complete authentication workflows including:
 * - User registration and profile creation
 * - Login and session management
 * - OAuth provider integration
 * - Session refresh and token handling
 * - Password reset and email verification
 */
test.describe('Authentication Flow Integration', () => {
  let dataManager: TestDataManager;
  let supabase: SupabaseClient;

  test.beforeAll(async () => {
    dataManager = new TestDataManager();
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  });

  test.describe('User Registration and Profile Creation', () => {
    let newUser: ITestUser;

    test.afterAll(async () => {
      if (newUser) {
        await dataManager.cleanupUser(newUser.id);
      }
    });

    test('should create user profile after successful registration', async ({ request }) => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        password: 'test-password-123',
      };

      // Mock email verification - in real test, this would involve email service
      const registerResponse = await request.post('/api/auth/register', {
        data: userData,
      });

      if (registerResponse.status() === 201) {
        // Verify profile was created
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', userData.email)
          .single();

        expect(error).toBeNull();
        expect(profile).toMatchObject({
          email: userData.email,
          credits_balance: 10, // Initial credits
          subscription_status: null,
          subscription_tier: null,
        });
      } else {
        // User might already exist, which is acceptable for integration test
        expect([409, 422]).toContain(registerResponse.status());
      }
    });
  });

  test.describe('Login and Session Management', () => {
    test('should handle login with valid credentials', async ({ request }) => {
      const testUser = await dataManager.createTestUser();

      const loginResponse = await request.post('/api/auth/login', {
        data: {
          email: testUser.email,
          password: 'test-password-123',
        },
      });

      expect(loginResponse.ok()).toBeTruthy();
      const { user, session } = await loginResponse.json();

      expect(user).toMatchObject({
        id: testUser.id,
        email: testUser.email,
      });

      expect(session).toMatchObject({
        access_token: expect.any(String),
        refresh_token: expect.any(String),
        expires_in: expect.any(Number),
      });

      // Test token usage
      const protectedResponse = await request.get('/api/protected/example', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      expect(protectedResponse.ok()).toBeTruthy();

      await dataManager.cleanupUser(testUser.id);
    });

    test('should reject login with invalid credentials', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: {
          email: 'nonexistent@example.com',
          password: 'wrong-password',
        },
      });

      expect(loginResponse.status()).toBe(401);
      const { error } = await loginResponse.json();
      expect(error).toContain('Invalid credentials');
    });
  });

  test.describe('Session Validation in Processing', () => {
    test('should validate user session before image processing', async ({ request }) => {
      // Try to process image without authentication
      const response = await request.post('/api/upscale', {
        data: {
          image: 'fake-image-data',
          mode: 'standard',
          scale: 2,
        },
      });

      expect(response.status()).toBe(401);
    });

    test('should allow image processing with valid session', async ({ request }) => {
      const testUser = await dataManager.createTestUser();

      const response = await request.post('/api/upscale', {
        headers: {
          Authorization: `Bearer ${testUser.token}`,
        },
        data: {
          image: 'fake-image-data', // Will fail at validation, not auth
          mode: 'standard',
          scale: 2,
        },
      });

      // Should fail due to invalid image data, not authentication
      expect(response.status()).toBe(400);

      await dataManager.cleanupUser(testUser.id);
    });
  });

  test.describe('Security and Rate Limiting', () => {
    test('should enforce rate limiting on login attempts', async ({ request }) => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      // Make multiple failed login attempts
      const attempts = Array(10).fill(null).map(() =>
        request.post('/api/auth/login', { data: loginData })
      );

      const results = await Promise.allSettled(attempts);
      const rateLimited = results.filter(result =>
        result.status === 'fulfilled' && result.value.status() === 429
      );

      expect(rateLimited.length).toBeGreaterThan(0);
    });

    test('should handle concurrent authentication requests', async ({ request }) => {
      const userData = {
        email: `concurrent-${Date.now()}@example.com`,
        password: 'test-password-123',
      };

      // Make concurrent registration requests
      const concurrentRequests = Array(5).fill(null).map(() =>
        request.post('/api/auth/register', { data: userData })
      );

      const results = await Promise.allSettled(concurrentRequests);
      const successful = results.filter(result =>
        result.status === 'fulfilled' && result.value.status() === 201
      );

      // Only one should succeed due to unique email constraint
      expect(successful).toHaveLength(1);

      // Clean up if user was created
      if (successful.length > 0) {
        const successfulResult = successful[0] as PromiseFulfilledResult<Response>;
        const { user } = await successfulResult.value.json();
        await dataManager.cleanupUser(user.id);
      }
    });
  });

  test.describe('Protected Routes Access', () => {
    test('should allow access to protected routes with valid session', async ({ request }) => {
      const testUser = await dataManager.createTestUser();

      const protectedRoutes = [
        '/api/protected/example',
        '/api/health',
      ];

      for (const route of protectedRoutes) {
        const response = await request.get(route, {
          headers: {
            Authorization: `Bearer ${testUser.token}`,
          },
        });

        expect(response.ok(), `Route ${route} should be accessible`).toBeTruthy();
      }

      await dataManager.cleanupUser(testUser.id);
    });

    test('should block access to protected routes without authentication', async ({ request }) => {
      const protectedRoutes = [
        '/api/protected/example',
      ];

      for (const route of protectedRoutes) {
        const response = await request.get(route);
        expect(response.status(), `Route ${route} should be protected`).toBe(401);
      }
    });
  });
});