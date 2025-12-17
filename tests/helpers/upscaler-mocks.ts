import type { Page, Route } from '@playwright/test';
import {
  mockUpscaleSuccessResponse,
  mockUpscaleErrorResponses,
  IMockUpscaleResponse,
} from '../fixtures';

export interface IApiMockConfig {
  delay?: number;
  response?: IMockUpscaleResponse | any;
  status?: number;
  shouldTimeout?: boolean;
}

export interface IAuthMockConfig {
  credits?: number;
  subscription?: any;
}

/**
 * Helper class for setting up consistent API mocks in upscaler tests
 */
export class UpscalerMockHelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Sets up authentication-related mocks
   */
  async setupAuthMocks(config: IAuthMockConfig = {}): Promise<void> {
    const { credits = 1000, subscription = null } = config;

    // Mock Supabase auth session
    await this.page.route('**/auth/v1/session', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            access_token: 'fake-test-token',
            user: { id: 'test-user-id', email: 'test@example.com' },
          },
        }),
      });
    });

    // Mock Supabase auth user
    await this.page.route('**/auth/v1/user**', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-user-id',
          email: 'test@example.com',
          aud: 'authenticated',
        }),
      });
    });

    // Mock get_user_data RPC with configurable credits
    await this.page.route('**/rest/v1/rpc/get_user_data', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          profile: {
            id: 'test-user-id',
            email: 'test@example.com',
            role: 'user',
            subscription_credits_balance: credits,
            purchased_credits_balance: 0,
          },
          subscription: subscription,
        }),
      });
    });

    // Catch-all for other auth endpoints
    await this.page.route('**/auth/v1/**', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            access_token: 'fake-test-token',
            user: { id: 'test-user-id', email: 'test@example.com' },
          },
        }),
      });
    });
  }

  /**
   * Sets up a mock for the upscale API endpoint
   */
  async setupUpscaleMock(config: IApiMockConfig = {}): Promise<void> {
    const {
      delay = 0,
      response = mockUpscaleSuccessResponse,
      status = 200,
      shouldTimeout = false,
    } = config;

    await this.page.route('**/api/upscale', async (route: Route) => {
      // Track that the mock was called
      console.log('🔥 Upscaler API mock intercepted request');

      if (shouldTimeout) {
        // Don't respond to simulate timeout
        return;
      }

      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });
  }

  /**
   * Sets up a success response mock
   */
  async mockSuccess(delay = 500): Promise<void> {
    await this.setupUpscaleMock({
      delay,
      response: mockUpscaleSuccessResponse,
      status: 200,
    });
  }

  /**
   * Sets up an insufficient credits error mock
   */
  async mockInsufficientCredits(): Promise<void> {
    await this.setupUpscaleMock({
      delay: 300,
      response: mockUpscaleErrorResponses.insufficientCredits,
      status: 402,
    });
  }

  /**
   * Sets up a server error mock
   */
  async mockServerError(): Promise<void> {
    await this.setupUpscaleMock({
      delay: 300,
      response: mockUpscaleErrorResponses.serverError,
      status: 500,
    });
  }

  /**
   * Sets up a timeout mock (no response)
   */
  async mockTimeout(): Promise<void> {
    await this.setupUpscaleMock({
      shouldTimeout: true,
    });
  }

  /**
   * Sets up a custom error response
   */
  async mockCustomError(error: any, status = 500, delay = 300): Promise<void> {
    await this.setupUpscaleMock({
      delay,
      response: error,
      status,
    });
  }

  /**
   * Sets up mocks and tracks API calls
   */
  async setupTrackedMock(
    config: IApiMockConfig = {}
  ): Promise<{ wasCalled: () => boolean; getCallCount: () => number }> {
    let callCount = 0;

    await this.page.route('**/api/upscale', async (route: Route) => {
      callCount++;
      console.log(`🔥 Upscaler API mock intercepted request (call #${callCount})`);

      if (config.shouldTimeout) {
        return;
      }

      const delay = config.delay || 0;
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      await route.fulfill({
        status: config.status || 200,
        contentType: 'application/json',
        body: JSON.stringify(config.response || mockUpscaleSuccessResponse),
      });
    });

    return {
      wasCalled: () => callCount > 0,
      getCallCount: () => callCount,
    };
  }

  /**
   * Clears all route handlers
   */
  async clearAllMocks(): Promise<void> {
    // Playwright doesn't have a direct way to clear route handlers
    // This is a placeholder for documentation purposes
    // In practice, you'd create a new page instance or manage routes differently
    console.log('Mock clearing requested - consider using a new page instance');
  }
}
