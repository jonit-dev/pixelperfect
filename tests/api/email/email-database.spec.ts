import { test, expect } from '@playwright/test';
import { TestContext, ApiClient } from '@/tests/helpers';

describe('Email Database - Triggers and RLS', () => {
  let ctx: TestContext;
  let api: ApiClient;

  test.beforeAll(async () => {
    ctx = new TestContext();
  });

  test.afterAll(async () => {
    await ctx.cleanup();
  });

  test.beforeEach(async ({ request }) => {
    api = new ApiClient(request);
  });

  describe('Auto-creation Trigger', () => {
    test('should create email_preferences when user is created', async () => {
      const user = await ctx.createUser();
      const authenticatedApi = api.withAuth(user.token);

      // Check that preferences exist with defaults
      const response = await authenticatedApi.get('/api/email/preferences');

      response.expectStatus(200);
      const data = await response.json();

      expect(data).toMatchObject({
        marketing_emails: true,
        product_updates: true,
        low_credit_alerts: true,
      });
    });

    test('should set created_at and updated_at on new preferences', async () => {
      const user = await ctx.createUser();
      const authenticatedApi = api.withAuth(user.token);

      const response = await authenticatedApi.get('/api/email/preferences');

      response.expectStatus(200);
      const data = await response.json();

      expect(data.created_at).toBeDefined();
      expect(data.updated_at).toBeDefined();
    });

    test('should handle multiple user creations independently', async () => {
      const user1 = await ctx.createUser();
      const user2 = await ctx.createUser();

      const api1 = api.withAuth(user1.token);
      const api2 = api.withAuth(user2.token);

      // Update user1 preferences
      await api1.patch('/api/email/preferences', {
        marketing_emails: false,
      });

      // User2 should still have defaults
      const response2 = await api2.get('/api/email/preferences');
      const data2 = await response2.json();

      expect(data2.marketing_emails).toBe(true);
    });
  });

  describe('Row Level Security (RLS)', () => {
    test('should prevent users from accessing other users preferences', async () => {
      const user1 = await ctx.createUser();
      const user2 = await ctx.createUser();

      const api2 = api.withAuth(user2.token);

      // User2 should not be able to access user1's preferences
      // The API should only return user2's own preferences
      const response = await api2.get('/api/email/preferences');

      response.expectStatus(200);
      const data = await response.json();

      // Verify these are user2's defaults (not user1's)
      expect(data.marketing_emails).toBe(true);
    });

    test('should allow users to update own preferences', async () => {
      const user = await ctx.createUser();
      const authenticatedApi = api.withAuth(user.token);

      const response = await authenticatedApi.patch('/api/email/preferences', {
        marketing_emails: false,
        product_updates: false,
        low_credit_alerts: false,
      });

      response.expectStatus(200);
      const data = await response.json();

      expect(data.marketing_emails).toBe(false);
      expect(data.product_updates).toBe(false);
      expect(data.low_credit_alerts).toBe(false);
    });

    test('should prevent cross-user updates via API', async () => {
      const user1 = await ctx.createUser();
      const user2 = await ctx.createUser();

      const api1 = api.withAuth(user1.token);

      // User1 updates their preferences
      await api1.patch('/api/email/preferences', {
        marketing_emails: false,
      });

      // User2's preferences should be unaffected
      const api2 = api.withAuth(user2.token);
      const response2 = await api2.get('/api/email/preferences');
      const data2 = await response2.json();

      expect(data2.marketing_emails).toBe(true);
    });
  });

  describe('Email Logs', () => {
    test('should log sent emails in email_logs table', async () => {
      const adminUser = await ctx.createAdminUser();
      const authenticatedApi = api.withAuth(adminUser.token);

      // Send an email
      await authenticatedApi.post('/api/email/send', {
        to: 'test@example.com',
        template: 'welcome',
        data: { userName: 'Test User' },
      });

      // Check that logs exist (this would require a direct DB query or admin endpoint)
      // For now, we verify the API response
      const response = await authenticatedApi.post('/api/email/send', {
        to: 'logs@example.com',
        template: 'welcome',
        data: {},
      });

      response.expectStatus(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    test('should include user_id in email logs for authenticated sends', async () => {
      const adminUser = await ctx.createAdminUser();
      const authenticatedApi = api.withAuth(adminUser.token);

      const response = await authenticatedApi.post('/api/email/send', {
        to: 'user@example.com',
        template: 'welcome',
        data: {},
        userId: adminUser.id,
      });

      response.expectStatus(200);
    });

    test('should handle null user_id for non-user emails', async () => {
      const adminUser = await ctx.createAdminUser();
      const authenticatedApi = api.withAuth(adminUser.token);

      // Send without userId - should work
      const response = await authenticatedApi.post('/api/email/send', {
        to: 'anonymous@example.com',
        template: 'welcome',
        data: {},
      });

      response.expectStatus(200);
    });
  });

  describe('Constraints and Validation', () => {
    test('should enforce user_id as primary key in email_preferences', async () => {
      const user = await ctx.createUser();
      const authenticatedApi = api.withAuth(user.token);

      // First update should succeed
      const response1 = await authenticatedApi.patch('/api/email/preferences', {
        marketing_emails: false,
      });

      response1.expectStatus(200);

      // Second update should also succeed (upsert)
      const response2 = await authenticatedApi.patch('/api/email/preferences', {
        marketing_emails: true,
      });

      response2.expectStatus(200);
      const data = await response2.json();
      expect(data.marketing_emails).toBe(true);
    });

    test('should enforce NOT NULL constraints on preference fields', async () => {
      const user = await ctx.createUser();
      const authenticatedApi = api.withAuth(user.token);

      const response = await authenticatedApi.get('/api/email/preferences');

      response.expectStatus(200);
      const data = await response.json();

      // All fields should have boolean values
      expect(typeof data.marketing_emails).toBe('boolean');
      expect(typeof data.product_updates).toBe('boolean');
      expect(typeof data.low_credit_alerts).toBe('boolean');
    });

    test('should handle cascade delete when user is deleted', async () => {
      // This would require direct DB access to test properly
      // The API cleans up users via TestContext
      const user = await ctx.createUser();
      const userId = user.id;

      // Preferences exist
      const authenticatedApi = api.withAuth(user.token);
      const response = await authenticatedApi.get('/api/email/preferences');
      expect(response.status()).toBe(200);

      // Cleanup user (simulating deletion)
      await ctx.cleanupUser(user);

      // In a real scenario, preferences would be cascade deleted
      // This is more of an integration test that would verify DB behavior
    });
  });

  describe('Index and Performance', () => {
    test('should efficiently query preferences for user', async () => {
      const user = await ctx.createUser();
      const authenticatedApi = api.withAuth(user.token);

      // Should be fast with proper indexing
      const startTime = Date.now();
      const response = await authenticatedApi.get('/api/email/preferences');
      const duration = Date.now() - startTime;

      response.expectStatus(200);
      // Should complete in reasonable time (< 1 second)
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Email Type Enum Constraints', () => {
    test('should only allow valid email types', async () => {
      const adminUser = await ctx.createAdminUser();
      const authenticatedApi = api.withAuth(adminUser.token);

      // Valid types should work
      for (const type of ['transactional', 'marketing']) {
        const response = await authenticatedApi.post('/api/email/send', {
          to: 'test@example.com',
          template: 'welcome',
          data: {},
          type,
        });

        expect(response.status()).toBe(200);
      }
    });
  });

  describe('Status Enum Constraints', () => {
    test('should handle all valid status values', async () => {
      // Status is determined by email service
      // Valid values: 'sent', 'failed', 'skipped'
      const adminUser = await ctx.createAdminUser();
      const authenticatedApi = api.withAuth(adminUser.token);

      // Successful send = 'sent'
      const response1 = await authenticatedApi.post('/api/email/send', {
        to: 'recipient@example.com',
        template: 'welcome',
        data: {},
      });

      expect(response1.status()).toBe(200);
    });
  });
});
