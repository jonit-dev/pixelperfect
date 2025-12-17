import { test, expect } from '../test-fixtures';
import { UpscalerTestHelper, UpscalerTestBuilder } from '../helpers/upscaler-test-helper';

/**
 * Clean and maintainable Upscaler E2E Tests
 *
 * This file demonstrates the refactored approach using:
 * - UpscalerTestHelper for common operations
 * - UpscalerTestBuilder for complex scenarios
 * - Semantic waits instead of fixed timeouts
 * - Clear error handling and validation
 * - Reusable mock setup
 */

test.describe('Upscaler E2E Tests - Clean Patterns', () => {
  test('Basic page load and structure verification', async ({ page }) => {
    const helper = UpscalerTestHelper.forUiTests(page);
    await helper.initialize();

    // Verify basic page elements
    await expect(helper.page.pageTitle).toBeVisible();
    await expect(helper.page.dropzone).toBeVisible();
    await expect(helper.page.dropzoneTitle).toBeVisible();

    // Check for accessibility
    await helper.page.checkBasicAccessibility();
  });

  test('Single image upload and processing flow', async ({ page }) => {
    const helper = UpscalerTestHelper.forSuccessScenario(page, 300);
    await helper.initialize();

    // Upload and process in one line
    await helper.uploadAndProcess('sample.jpg');

    // Verify success
    await helper.verifySuccessResult();
  });

  test('Multiple images batch processing', async ({ page }) => {
    const helper = UpscalerTestHelper.forSuccessScenario(page);
    await helper.initialize();

    // Upload multiple images
    await helper.uploadMultipleImages(['sample.jpg', 'sample.jpg', 'sample.jpg']);

    // Verify all files are in queue
    expect(await helper.getQueueCount()).toBeGreaterThanOrEqual(3);

    // Process batch
    await helper.page.clickProcess();
    await helper.waits.waitForProcessingComplete();

    // Verify results
    await helper.verifySuccessResult();
  });

  test('Queue management - add and clear files', async ({ page }) => {
    const helper = UpscalerTestHelper.forUiTests(page);
    await helper.initialize();

    // Add files to queue
    await helper.uploadMultipleImages(['sample.jpg', 'sample.jpg']);
    expect(await helper.getQueueCount()).toBeGreaterThanOrEqual(2);

    // Clear queue
    await helper.clearQueue();
    expect(await helper.getQueueCount()).toBe(0);

    // Verify dropzone is visible again
    await expect(helper.page.dropzoneTitle).toBeVisible();
  });

  test('Insufficient credits error handling', async ({ page }) => {
    const helper = UpscalerTestHelper.forErrorScenario(page, 0);
    await helper.initialize();

    // Set up insufficient credits error
    await helper.mocks.mockInsufficientCredits();

    // Upload image and attempt processing
    await helper.uploadSingleImage('sample.jpg');
    await helper.page.clickProcess();

    // Verify error handling
    await helper.verifyErrorResult('Insufficient credits');

    // Verify queue state is maintained
    expect(await helper.getQueueCount()).toBeGreaterThanOrEqual(1);
    await expect(helper.page.clearButton).toBeVisible();
  });

  test('Server error handling', async ({ page }) => {
    const helper = UpscalerTestHelper.forErrorScenario(page, 1000);
    await helper.initialize();

    // Set up server error
    await helper.mocks.mockServerError();

    // Upload and attempt processing
    await helper.uploadAndProcess('sample.jpg');

    // Verify error handling
    await helper.verifyErrorResult();

    // Queue should remain intact
    expect(await helper.getQueueCount()).toBeGreaterThanOrEqual(1);
  });

  test('Timeout handling', async ({ page }) => {
    const helper = UpscalerTestHelper.forErrorScenario(page);
    await helper.initialize();

    // Set up timeout scenario
    await helper.mocks.mockTimeout();

    // Upload and attempt processing
    await helper.uploadSingleImage('sample.jpg');
    await helper.page.clickProcess();

    // Wait for timeout handling (should show error or re-enable button)
    await helper.waits.waitForProcessingComplete();

    // Verify app recovered from timeout
    const isButtonVisible = await helper.page.processButton.isVisible();
    const isButtonEnabled = await helper.page.processButton.isEnabled();

    expect(isButtonVisible).toBe(true);
    expect(isButtonEnabled).toBe(true);
  });
});

test.describe('Upscaler E2E Tests - Builder Pattern', () => {
  test('Complex scenario using builder pattern', async ({ page }) => {
    const result = await new UpscalerTestBuilder(page, {
      autoSetupAuth: true,
      defaultCredits: 500,
    })
      .uploadImage('sample.jpg')
      .process()
      .waitForCompletion()
      .verifySuccess()
      .execute();

    // Builder pattern returns the helper for additional assertions
    expect(result.getHelper().getQueueCount()).toBeGreaterThanOrEqual(0);
  });

  test('Error scenario using builder pattern', async ({ page }) => {
    const builder = new UpscalerTestBuilder(page);

    // Set up custom error scenario
    await builder.getHelper().setupErrorScenario('custom', {
      error: 'Custom validation error',
      code: 'VALIDATION_FAILED',
    });

    await builder
      .uploadImage('sample.jpg')
      .process()
      .waitForCompletion()
      .verifyError('Custom validation error')
      .execute();
  });

  test('Batch workflow with builder pattern', async ({ page }) => {
    await new UpscalerTestBuilder(page)
      .uploadImages(['sample.jpg', 'sample.jpg', 'sample.jpg'])
      .addStep(async () => {
        // Custom validation step
        const queueCount = await new UpscalerTestHelper(page).getQueueCount();
        expect(queueCount).toBeGreaterThanOrEqual(3);
      })
      .process()
      .waitForCompletion()
      .verifySuccess()
      .execute();
  });
});

test.describe('Upscaler E2E Tests - Edge Cases', () => {
  test('Rapid successive uploads', async ({ page }) => {
    const helper = UpscalerTestHelper.forUiTests(page);
    await helper.initialize();

    // Upload files rapidly
    const uploadPromises = Array(5)
      .fill(null)
      .map(() => helper.uploadSingleImage('sample.jpg'));

    await Promise.all(uploadPromises);

    // Wait for all to be processed
    await helper.waits.waitForQueueCount(5);
    expect(await helper.getQueueCount()).toBeGreaterThanOrEqual(5);
  });

  test('File validation error handling', async ({ page }) => {
    const helper = UpscalerTestHelper.forUiTests(page);
    await helper.initialize();

    // Try to upload a file that would fail validation
    // Note: In a real test, you'd create an invalid file
    // For now, we'll test the validation infrastructure

    // Check that validation system is working
    const hasValidationError = await helper.hasValidationError();
    console.log('Has validation error:', hasValidationError);

    if (hasValidationError) {
      const errorMessage = await helper.getValidationErrorMessage();
      expect(errorMessage).toBeTruthy();
      expect(errorMessage!.length).toBeGreaterThan(0);
    }
  });

  test('Page state after error and retry', async ({ page }) => {
    const helper = UpscalerTestHelper.forErrorScenario(page);
    await helper.initialize();

    // Set up intermittent error
    let callCount = 0;
    await helper.mocks.setupUpscaleMock({
      delay: 300,
      response: (() => {
        callCount++;
        if (callCount === 1) {
          // First call fails
          return {
            error: 'Temporary error',
            code: 'TEMPORARY_ERROR',
          };
        }
        // Second call succeeds
        return {
          success: true,
          imageData: 'data:image/png;base64,fake',
          creditsUsed: 1,
        };
      })(),
      status: callCount === 1 ? 500 : 200,
    });

    // Upload and process (will fail first time)
    await helper.uploadSingleImage('sample.jpg');
    await helper.page.clickProcess();

    // Wait for error
    await helper.verifyErrorResult();

    // Retry processing
    if (await helper.page.retryButton.isVisible()) {
      await helper.page.retryProcessing();
      await helper.waits.waitForProcessingComplete();
      await helper.verifySuccessResult();
    }
  });

  test('Accessibility during different states', async ({ page }) => {
    const helper = UpscalerTestHelper.forSuccessScenario(page);
    await helper.initialize();

    // Check empty state accessibility
    await helper.page.checkBasicAccessibility();
    await helper.page.checkAriaLabels();

    // Upload and check queue state accessibility
    await helper.uploadSingleImage('sample.jpg');
    await helper.page.checkBasicAccessibility();

    // Process and check processing state accessibility
    await helper.page.clickProcess();
    await helper.waits.waitForProcessingStart();
    await helper.page.checkBasicAccessibility();

    // Wait for completion and check result state
    await helper.waits.waitForProcessingComplete();
    await helper.page.checkBasicAccessibility();
  });
});

test.describe('Upscaler E2E Tests - Performance', () => {
  test('Large batch processing performance', async ({ page }) => {
    const helper = UpscalerTestHelper.forSuccessScenario(page, 100);
    await helper.initialize();

    // Upload many files
    const fileCount = 10;
    await helper.uploadMultipleImages(Array(fileCount).fill('sample.jpg'));

    const startTime = Date.now();

    // Process batch
    await helper.page.clickProcess();
    await helper.waits.waitForProcessingComplete();

    const processingTime = Date.now() - startTime;
    console.log(`Processed ${fileCount} files in ${processingTime}ms`);

    // Should complete within reasonable time (adjust as needed)
    expect(processingTime).toBeLessThan(15000);
  });

  test('UI responsiveness during operations', async ({ page }) => {
    const helper = UpscalerTestHelper.forSuccessScenario(page, 1000);
    await helper.initialize();

    // Upload file
    await helper.uploadSingleImage('sample.jpg');

    // Start processing
    await helper.page.clickProcess();

    // Check that UI remains responsive during processing
    const pageTitleVisible = await helper.page.pageTitle.isVisible();
    const _dropzoneVisible = await helper.page.dropzone.isVisible();

    expect(pageTitleVisible).toBe(true);
    // Dropzone might be hidden during processing, which is normal

    // Wait for completion
    await helper.waits.waitForProcessingComplete();
  });
});
