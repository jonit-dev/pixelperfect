# Integration Testing Guide

## Overview
Integration tests verify that multiple components work together correctly. They sit between unit tests (single components) and E2E tests (full user journeys).

## Your Current Setup
- **Testing Stack**: Playwright for integration tests, Vitest for unit tests
- **Test Data**: TestDataManager helper for creating/managing test users
- **Database**: Real Supabase instance with service role access
- **Authentication**: JWT token handling for authenticated requests
- **Environment**: `.env.test` for test-specific configuration

## Writing Integration Tests

### 1. File Structure
```
tests/integration/
├── auth.integration.spec.ts     # Authentication flows
├── billing.integration.spec.ts  # Billing and payments
├── upscaler.integration.spec.ts # Image processing workflows
├── api.integration.spec.ts      # API endpoint integration
└── workflows.integration.spec.ts # Cross-system workflows
```

### 2. Test Patterns

#### API Integration Tests
Test complete API workflows with authentication and database interactions:

```typescript
import { test, expect } from '@playwright/test';
import { TestDataManager } from '../helpers/test-data-manager';

test.describe('API Integration Tests', () => {
  let dataManager: TestDataManager;
  let testUser: ITestUser;

  test.beforeAll(async () => {
    dataManager = new TestDataManager();
    testUser = await dataManager.createTestUser();
  });

  test.afterAll(async () => {
    await dataManager.cleanupUser(testUser.id);
  });

  test('should handle complete upscaler workflow', async ({ request }) => {
    // 1. Upload image
    const uploadResponse = await request.post('/api/upscale', {
      headers: {
        Authorization: `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      data: {
        imageUrl: 'https://example.com/test.jpg',
        upscaleFactor: 2,
      },
    });

    expect(uploadResponse.ok()).toBeTruthy();
    const { jobId, creditsRequired } = await uploadResponse.json();

    // 2. Check job status
    const statusResponse = await request.get(`/api/jobs/${jobId}`, {
      headers: {
        Authorization: `Bearer ${testUser.token}`,
      },
    });

    expect(statusResponse.ok()).toBeTruthy();
    const { status, resultUrl } = await statusResponse.json();

    // 3. Verify credits were deducted
    const profile = await dataManager.getUserProfile(testUser.id);
    expect(profile.credits_balance).toBeLessThan(10); // Initial balance
  });
});
```

#### Database Integration Tests
Test database operations and constraints:

```typescript
test.describe('Database Integration Tests', () => {
  let dataManager: TestDataManager;
  let supabase: SupabaseClient;

  test.beforeAll(async () => {
    dataManager = new TestDataManager();
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  });

  test('should enforce credit constraints across operations', async () => {
    const user = await dataManager.createTestUser();

    // Test concurrent operations
    const operations = Array(5).fill(null).map((_, i) =>
      supabase.rpc('decrement_credits_with_log', {
        target_user_id: user.id,
        amount: 5,
        transaction_type: 'usage',
        ref_id: `job_${i}`,
      })
    );

    const results = await Promise.allSettled(operations);

    // Only first 2 operations should succeed (10 credits available)
    const successful = results.filter(r => r.status === 'fulfilled' && !r.value.error);
    expect(successful).toHaveLength(2);
  });
});
```

#### Authentication Integration Tests
Test complete authentication flows:

```typescript
test.describe('Authentication Integration', () => {
  test('should handle OAuth flow with profile creation', async ({ page }) => {
    await page.goto('/login');

    // Mock OAuth redirect
    await page.route('**/auth/callback**', route => {
      route.fulfill({
        status: 302,
        headers: {
          Location: '/dashboard?message=Authentication successful',
        },
      });
    });

    await page.click('[data-testid="google-login"]');
    await expect(page).toHaveURL(/dashboard/);

    // Verify profile was created in database
    const dataManager = new TestDataManager();
    // Additional verification logic...
  });
});
```

### 3. Test Data Management

#### Use TestDataManager for User Management
```typescript
const dataManager = new TestDataManager();

// Create users with specific states
const freeUser = await dataManager.createTestUserWithSubscription('free');
const proUser = await dataManager.createTestUserWithSubscription('active', 'pro', 50);

// Clean up automatically
test.afterAll(async () => {
  await dataManager.cleanupAllUsers();
});
```

#### Use Fixtures for Consistent Data
```typescript
// tests/fixtures/index.ts
export const TEST_IMAGE_URL = 'https://example.com/test-image.jpg';
export const TEST_UPSCALE_FACTORS = [2, 3, 4];

export const createMockStripeEvent = (overrides?: any) => ({
  id: `evt_test_${Date.now()}`,
  type: 'checkout.session.completed',
  data: {
    object: {
      id: `cs_test_${Date.now()}`,
      payment_status: 'paid',
      metadata: {
        user_id: 'test-user-id',
        credits_amount: '100',
      },
      ...overrides,
    },
  },
});
```

### 4. Error Handling Tests

Test error scenarios and edge cases:

```typescript
test.describe('Error Handling Integration', () => {
  test('should handle stripe webhook failures gracefully', async ({ request }) => {
    const invalidWebhook = {
      id: 'evt_invalid',
      type: 'checkout.session.completed',
      data: { object: null }, // Invalid data
    };

    const response = await request.post('/api/webhooks/stripe', {
      headers: {
        'Stripe-Signature': 'invalid-signature',
      },
      data: invalidWebhook,
    });

    expect(response.status()).toBe(400);

    // Verify no credits were added
    const dataManager = new TestDataManager();
    // Verification logic...
  });
});
```

### 5. Performance Tests

Test performance characteristics:

```typescript
test.describe('Performance Integration', () => {
  test('should handle concurrent upscaler requests', async ({ request }) => {
    const user = await dataManager.createTestUserWithSubscription('active', 'pro', 100);

    const concurrentRequests = Array(10).fill(null).map(() =>
      request.post('/api/upscale', {
        headers: { Authorization: `Bearer ${user.token}` },
        data: { imageUrl: 'test.jpg', upscaleFactor: 2 },
      })
    );

    const startTime = Date.now();
    const results = await Promise.allSettled(concurrentRequests);
    const duration = Date.now() - startTime;

    // Should complete within reasonable time
    expect(duration).toBeLessThan(10000);

    // Most requests should succeed
    const successful = results.filter(r => r.status === 'fulfilled');
    expect(successful.length).toBeGreaterThan(8);
  });
});
```

### 6. Security Tests

Test security measures:

```typescript
test.describe('Security Integration', () => {
  test('should enforce rate limiting', async ({ request }) => {
    const user = await dataManager.createTestUser();

    // Make rapid requests
    const requests = Array(100).fill(null).map(() =>
      request.get('/api/user/profile', {
        headers: { Authorization: `Bearer ${user.token}` },
      })
    );

    const results = await Promise.allSettled(requests);
    const rateLimited = results.filter(r =>
      r.status === 'fulfilled' && r.value.status() === 429
    );

    expect(rateLimited.length).toBeGreaterThan(0);
  });

  test('should prevent unauthorized access', async ({ request }) => {
    const response = await request.get('/api/protected/example');
    expect(response.status()).toBe(401);
  });
});
```

### 7. Best Practices

#### Test Organization
- Use descriptive test names that explain the behavior
- Group related tests in `describe` blocks
- Use `beforeAll`/`afterAll` for expensive setup
- Use `beforeEach`/`afterEach` for test isolation

#### Test Data
- Use consistent test data across tests
- Clean up test data after each test
- Use realistic data that matches production

#### Assertions
- Test both positive and negative scenarios
- Verify database state changes
- Check side effects (logs, analytics, etc.)

#### Error Handling
- Test error scenarios thoroughly
- Verify proper error responses
- Test system recovery from failures

### 8. Running Integration Tests

```bash
# Run all integration tests
yarn test:integration

# Run specific integration test file
yarn playwright test tests/integration/auth.integration.spec.ts

# Run with UI for debugging
yarn test:integration:ui

# Run with coverage
yarn test:integration --coverage
```

### 9. CI/CD Integration

Your integration tests should run in CI/CD:

```yaml
# .github/workflows/test.yml
- name: Run Integration Tests
  run: |
    yarn test:integration
```

### 10. Common Patterns

#### API Endpoint Testing
```typescript
test('should handle complete API workflow', async ({ request }) => {
  // Arrange
  const user = await dataManager.createTestUser();

  // Act
  const response = await request.post('/api/endpoint', {
    headers: { Authorization: `Bearer ${user.token}` },
    data: testData,
  });

  // Assert
  expect(response.ok()).toBeTruthy();
  const result = await response.json();
  expect(result).toMatchObject(expectedResult);

  // Verify side effects
  const profile = await dataManager.getUserProfile(user.id);
  expect(profile.updated_at).not.toBeNull();
});
```

#### Database Transaction Testing
```typescript
test('should maintain database consistency', async () => {
  const supabase = createClient(URL, SERVICE_KEY);
  const user = await dataManager.createTestUser();

  await supabase.rpc('complex_operation', {
    user_id: user.id,
    parameters: testParams,
  });

  // Verify all related tables are consistent
  const profile = await dataManager.getUserProfile(user.id);
  const transactions = await dataManager.getCreditTransactions(user.id);

  expect(profile.credits_balance).toBe(
    transactions.reduce((sum, tx) => sum + tx.amount, 0)
  );
});
```

This guide provides a comprehensive foundation for writing robust integration tests that verify your application's components work together correctly.