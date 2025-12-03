import { test as base } from '@playwright/test';

type AuthFixtures = {
  authenticatedRequest: ReturnType<typeof base.use>;
  testUser: { id: string; email: string; token: string };
};

export const test = base.extend<AuthFixtures>({
  testUser: async ({ }, use) => {
    // Use mock test user for API testing to avoid Supabase rate limits
    // This approach is faster and more reliable for testing
    const testUser = {
      id: 'test-user-id-12345',
      email: 'test@example.com',
      token: process.env.TEST_AUTH_TOKEN || 'test_auth_token_for_testing_only',
    };

    await use(testUser);
  },

  authenticatedRequest: async ({ testUser }, use) => {
    // This fixture provides authenticated request context
    await use({ testUser });
  },
});

export { expect } from '@playwright/test';