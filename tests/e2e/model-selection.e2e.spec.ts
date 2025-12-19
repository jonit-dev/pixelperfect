import { test, expect } from '@playwright/test';
import { TestContext } from '../helpers';
import { UpscalerPage } from '../pages/UpscalerPage';

test.describe('E2E: Model Selection UI', () => {
  let ctx: TestContext;
  let upscalerPage: UpscalerPage;

  test.beforeAll(async () => {
    ctx = new TestContext();
  });

  test.afterAll(async () => {
    await ctx.cleanup();
  });

  test.beforeEach(async ({ page }) => {
    upscalerPage = new UpscalerPage(page);
  });

  test('should show model selection UI after image upload', async ({ page }) => {
    // Go to upscaler page
    await upscalerPage.goto('/upscaler');

    // Upload an image to activate the workspace
    await upscalerPage.uploadImage('tests/fixtures/sample.jpg');

    // Wait for the workspace to load by checking for files in queue
    await page.waitForFunction(
      () => {
        const queueItems = document.querySelectorAll('[data-testid="queue-item"]');
        return queueItems.length > 0;
      },
      {},
      { timeout: 10000 }
    );

    // Look for the quality tier selector
    await expect(page.getByText('Quality Tier')).toBeVisible({ timeout: 10000 });

    // Look for the current tier selection button (shows "Quick" by default)
    const currentTierButton = page
      .locator('button')
      .filter({ hasText: /Quick|Auto|Face Restore|HD Upscale|Face Pro|Ultra/ })
      .first();
    await expect(currentTierButton).toBeVisible();

    // Open the dropdown to check options
    await currentTierButton.click();

    // Check that tier options exist in the dropdown (use more specific selectors to avoid strict mode violations)
    await expect(page.locator('button').filter({ hasText: 'Auto' }).first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('button').filter({ hasText: 'Quick' }).first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('button').filter({ hasText: 'HD Upscale' }).first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('button').filter({ hasText: 'Face Pro' }).first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('button').filter({ hasText: 'Ultra' }).first()).toBeVisible({
      timeout: 5000,
    });

    // Check for the Auto tier with recommended badge (use first occurrence)
    await expect(page.getByText('Recommended').first()).toBeVisible({ timeout: 5000 });
  });

  test('should show operation mode buttons', async ({ page }) => {
    await upscalerPage.goto('/upscaler');
    await upscalerPage.uploadImage('tests/fixtures/sample.jpg');

    // Wait for the workspace to load by checking for files in queue
    await page.waitForFunction(
      () => {
        const queueItems = document.querySelectorAll('[data-testid="queue-item"]');
        return queueItems.length > 0;
      },
      {},
      { timeout: 10000 }
    );

    // Look for enhancement options section instead of operation mode
    await expect(page.getByText('Additional Enhancements')).toBeVisible();

    // Check for enhancement options using the new UI
    await expect(page.getByText('Enhance Image')).toBeVisible();
    await expect(page.getByText('Enhance Faces')).toBeVisible();
    await expect(page.getByText('Preserve Text')).toBeVisible();
  });

  test('should show scale options', async ({ page }) => {
    await upscalerPage.goto('/upscaler');
    await upscalerPage.uploadImage('tests/fixtures/sample.jpg');

    // Wait for the workspace to load by checking for files in queue
    await page.waitForFunction(
      () => {
        const queueItems = document.querySelectorAll('[data-testid="queue-item"]');
        return queueItems.length > 0;
      },
      {},
      { timeout: 10000 }
    );

    // Check for upscale factor section
    await expect(page.getByText('Upscale Factor')).toBeVisible();

    // Look for scale buttons
    await expect(page.getByRole('button', { name: '2x' })).toBeVisible();
    await expect(page.getByRole('button', { name: '4x' })).toBeVisible();
    await expect(page.getByRole('button', { name: '8x' })).toBeVisible();
  });

  test('should show processing options', async ({ page }) => {
    await upscalerPage.goto('/upscaler');
    await upscalerPage.uploadImage('tests/fixtures/sample.jpg');

    // Wait for the workspace to load by checking for files in queue
    await page.waitForFunction(
      () => {
        const queueItems = document.querySelectorAll('[data-testid="queue-item"]');
        return queueItems.length > 0;
      },
      {},
      { timeout: 10000 }
    );

    // Check for processing options in the Additional Enhancements section
    await expect(page.getByText('Preserve Text')).toBeVisible();
    await expect(page.getByText('Enhance Faces')).toBeVisible();
    await expect(page.getByText('Custom Instructions')).toBeVisible();
  });
});
