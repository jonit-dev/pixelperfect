import { Page, Route } from '@playwright/test';

export interface IMockCheckoutResponse {
  url: string;
  sessionId?: string;
}

export interface IMockCheckoutOptions {
  successUrl?: string;
  cancelUrl?: string;
  simulateError?: boolean;
  errorMessage?: string;
  delay?: number;
}

/**
 * Helper class for mocking Stripe checkout API calls in tests
 */
export class CheckoutMock {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Mock the checkout API to return a success response that redirects to success page
   * This bypasses the actual Stripe checkout flow for testing purposes
   */
  async mockCheckoutSuccess(options: IMockCheckoutOptions = {}): Promise<void> {
    const {
      successUrl = '/success?session_id=test_session_mock_123',
      simulateError = false,
      errorMessage = 'Checkout failed',
      delay = 100,
    } = options;

    await this.page.route('/api/checkout', async (route: Route) => {
      // Add small delay to simulate network latency
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      if (simulateError) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: errorMessage }),
        });
        return;
      }

      // Mock successful checkout response
      const mockResponse: IMockCheckoutResponse = {
        url: `${successUrl}`,
        sessionId: 'test_session_mock_123',
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse),
      });
    });
  }

  /**
   * Mock the checkout API to return an error response
   */
  async mockCheckoutError(
    errorMessage: string = 'Checkout failed',
    status: number = 400
  ): Promise<void> {
    await this.page.route('/api/checkout', async (route: Route) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ error: errorMessage }),
      });
    });
  }

  /**
   * Mock the customer portal API
   */
  async mockPortalSuccess(
    portalUrl: string = 'https://billing.stripe.com/session/test'
  ): Promise<void> {
    await this.page.route('/api/portal', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: portalUrl }),
      });
    });
  }

  /**
   * Mock the customer portal API to return an error
   */
  async mockPortalError(errorMessage: string = 'Portal access failed'): Promise<void> {
    await this.page.route('/api/portal', async (route: Route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: errorMessage }),
      });
    });
  }

  /**
   * Mock checkout with network error (no response)
   */
  async mockCheckoutNetworkError(): Promise<void> {
    await this.page.route('/api/checkout', async (route: Route) => {
      await route.abort('failed');
    });
  }

  /**
   * Mock checkout with timeout
   */
  async mockCheckoutTimeout(): Promise<void> {
    await this.page.route('/api/checkout', async () => {
      // Never fulfill the request to simulate timeout
      // Will be automatically aborted after test timeout
    });
  }

  /**
   * Restore all mocked routes
   */
  async restore(): Promise<void> {
    // This would be called to clean up mocks, but Playwright automatically
    // handles route cleanup when the page context is destroyed
  }

  /**
   * Listen for checkout requests and capture their data
   */
  async captureCheckoutRequests(): Promise<
    Array<{ priceId: string; metadata: Record<string, string> }>
  > {
    const capturedRequests: Array<{ priceId: string; metadata: Record<string, string> }> = [];

    await this.page.route('/api/checkout', async (route: Route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      capturedRequests.push({
        priceId: postData.priceId,
        metadata: postData.metadata || {},
      });

      // Let the request continue through normal flow
      await route.continue();
    });

    return capturedRequests;
  }

  /**
   * Wait for a checkout request to be made
   */
  async waitForCheckoutRequest(): Promise<{ priceId: string; metadata: Record<string, string> }> {
    return new Promise((resolve, reject) => {
      let resolved = false;

      this.page.route('/api/checkout', async (route: Route) => {
        if (resolved) return; // Only handle first request

        resolved = true;
        const request = route.request();
        const postData = request.postDataJSON();

        resolve({
          priceId: postData.priceId,
          metadata: postData.metadata || {},
        });

        // Fulfill with mock success response
        const mockResponse: IMockCheckoutResponse = {
          url: '/success?session_id=test_session_mock_123',
          sessionId: 'test_session_mock_123',
        };

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockResponse),
        });
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!resolved) {
          reject(new Error('Timeout waiting for checkout request'));
        }
      }, 5000);
    });
  }
}
