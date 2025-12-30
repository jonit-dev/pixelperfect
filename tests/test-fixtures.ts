import { test as base } from '@playwright/test';

/**
 * Extended Playwright test with global fixtures
 *
 * This adds the test environment marker and test headers to prevent
 * unwanted redirects during E2E tests.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Import auth helpers
    const { getAuthInitScript, getTestHeaders } = await import('./helpers/auth-helpers');

    // Inject test environment markers and auth state before each test
    await page.addInitScript(getAuthInitScript());

    // Add test headers to all requests to bypass auth redirects in middleware
    await page.route('**/*', async route => {
      const testHeaders = getTestHeaders();
      const headers = { ...route.request().headers(), ...testHeaders };
      await route.continue({ headers });
    });

    await use(page);
  },
});

export { expect } from '@playwright/test';
