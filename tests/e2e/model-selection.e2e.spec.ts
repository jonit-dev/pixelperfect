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

    // Wait for the workspace to load
    await page.waitForTimeout(2000);

    // Look for the model selector - using a more specific selector
    const modelDropdown = page.locator('select').first();
    await expect(modelDropdown).toBeVisible({ timeout: 10000 });

    // Check that options exist
    const options = await modelDropdown.locator('option').count();
    expect(options).toBeGreaterThan(0);

    // Check for the AI Model label
    await expect(page.getByText('AI Model')).toBeVisible({ timeout: 5000 });
  });

  test('should show operation mode buttons', async ({ page }) => {
    await upscalerPage.goto('/upscaler');
    await upscalerPage.uploadImage('tests/fixtures/sample.jpg');
    await page.waitForTimeout(2000);

    // Look for operation mode section
    await expect(page.getByText('Operation Mode')).toBeVisible();

    // Check for mode buttons using text content
    await expect(page.getByRole('button', { name: 'Upscale' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enhance' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Both' })).toBeVisible();
  });

  test('should show scale options', async ({ page }) => {
    await upscalerPage.goto('/upscaler');
    await upscalerPage.uploadImage('tests/fixtures/sample.jpg');
    await page.waitForTimeout(2000);

    // Check for scale factor section
    await expect(page.getByText('Upscale Factor')).toBeVisible();

    // Look for scale buttons
    await expect(page.getByRole('button', { name: '2x' })).toBeVisible();
    await expect(page.getByRole('button', { name: '4x' })).toBeVisible();
    await expect(page.getByRole('button', { name: '8x' })).toBeVisible();
  });

  test('should show processing options', async ({ page }) => {
    await upscalerPage.goto('/upscaler');
    await upscalerPage.uploadImage('tests/fixtures/sample.jpg');
    await page.waitForTimeout(2000);

    // Check for processing options text
    await expect(page.getByText('Preserve Text')).toBeVisible();
    await expect(page.getByText('Enhance Face')).toBeVisible();
  });
});
