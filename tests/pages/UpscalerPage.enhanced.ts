import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { UpscalerWaitHelper } from '../helpers/upscaler-waits';

export type UpscaleMode = 'upscale' | 'enhance' | 'both';

/**
 * Enhanced UpscalerPage with improved waiting strategies and error handling
 * Integrates with UpscalerWaitHelper for semantic waits instead of fixed timeouts
 */
export class UpscalerPageEnhanced extends BasePage {
  private waitHelper: UpscalerWaitHelper;

  // Page elements
  readonly pageTitle: Locator;
  readonly pageDescription: Locator;

  // Workspace - Empty state (Dropzone)
  readonly dropzone: Locator;
  readonly dropzoneTitle: Locator;
  readonly fileInput: Locator;

  // Workspace - Active state
  readonly workspace: Locator;
  readonly batchSidebar: Locator;
  readonly previewArea: Locator;
  readonly queueStrip: Locator;

  // Config controls
  readonly modeSelector: Locator;
  readonly scaleSelector: Locator;

  // Action buttons
  readonly processButton: Locator;
  readonly clearButton: Locator;
  readonly downloadButton: Locator;
  readonly retryButton: Locator;

  // Status indicators
  readonly progressIndicator: Locator;
  readonly errorMessage: Locator;
  readonly successIndicator: Locator;

  constructor(page: Page) {
    super(page);
    this.waitHelper = new UpscalerWaitHelper(page);

    // Page header
    this.pageTitle = page.getByRole('heading', { name: 'AI Image Upscaler' });
    this.pageDescription = page.getByText(
      'Enhance and upscale your images using advanced AI technology'
    );

    // Dropzone (empty state) - using more specific selectors
    this.dropzone = page.locator('[data-testid="dropzone"], .border-dashed').first();
    this.dropzoneTitle = page.getByText('Click or drag images').first();
    this.fileInput = page.locator('input[type="file"]').first();

    // Workspace sections
    this.workspace = page.locator('.bg-white.rounded-2xl.shadow-xl').first();
    this.batchSidebar = page.locator('[class*="BatchSidebar"], .md\\:w-72').first();
    this.previewArea = page.locator('[class*="PreviewArea"], .flex-grow.p-6').first();
    this.queueStrip = page.locator('[class*="QueueStrip"], .border-t').first();

    // Config controls - more specific selectors
    this.modeSelector = page.locator('[data-testid="mode-selector"], [role="combobox"]').first();
    this.scaleSelector = page
      .locator('[data-testid="scale-selector"], select')
      .filter({ hasText: /2x|4x/i })
      .first();

    // Action buttons - improved selectors with data-testid fallbacks
    this.processButton = page
      .locator(
        [
          '[data-testid="process-button"]',
          'button:has-text("Process All")',
          'button:has-text("Processing...")',
          'button:has-text("Process Remaining")',
          'button:has-text("Process")',
        ].join(', ')
      )
      .first();

    this.clearButton = page
      .locator(
        [
          '[data-testid="clear-button"]',
          'button:has-text("Clear Queue")',
          'button:has-text("Clear All")',
          'button[aria-label*="Clear"]',
        ].join(', ')
      )
      .first();

    this.downloadButton = page
      .locator(
        [
          '[data-testid="download-button"]',
          'button:has-text("Download Result")',
          'button:has-text("Download All")',
          'button:has-text("Download")',
        ].join(', ')
      )
      .first();

    this.retryButton = page
      .locator(
        [
          '[data-testid="retry-button"]',
          'button:has-text("Try Again")',
          'button:has-text("Retry")',
        ].join(', ')
      )
      .first();

    // Status indicators with better selectors
    this.progressIndicator = page
      .locator(
        [
          '[role="progressbar"]',
          '[data-testid="progress-indicator"]',
          '.animate-pulse',
          'button:has(svg.animate-spin)',
        ].join(', ')
      )
      .first();

    this.errorMessage = page
      .locator(
        [
          '[data-testid="error-message"]',
          '.text-red-600',
          '.text-red-500',
          '[role="alert"]',
          '.error-message',
        ].join(', ')
      )
      .first();

    this.successIndicator = page
      .locator(
        [
          '[data-testid="success-message"]',
          ':has-text("Processing Complete")',
          ':has-text("Enhanced Successfully")',
        ].join(', ')
      )
      .first();
  }

  /**
   * Navigate to the upscaler page
   */
  async goto(): Promise<void> {
    await super.goto('/upscaler');
    await this.waitHelper.waitForUiStable();
  }

  /**
   * Wait for the page to load completely
   */
  async waitForLoad(): Promise<void> {
    await this.waitForPageLoad();
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
    await expect(this.workspace).toBeVisible();
  }

  /**
   * Upload an image file with improved error handling
   */
  async uploadImage(filePath: string): Promise<void> {
    // Verify file input is available
    await expect(this.fileInput).toBeVisible({ timeout: 5000 });

    // Upload file
    await this.fileInput.setInputFiles(filePath);

    // Wait for file to be processed using semantic wait
    await this.waitHelper.waitForFileInQueue();
  }

  /**
   * Upload multiple images
   */
  async uploadImages(filePaths: string[]): Promise<void> {
    if (filePaths.length === 0) {
      throw new Error('No files provided for upload');
    }

    await expect(this.fileInput).toBeVisible({ timeout: 5000 });
    await this.fileInput.setInputFiles(filePaths);

    // Wait for all files to appear in queue
    await this.waitHelper.waitForQueueCount(filePaths.length);
  }

  /**
   * Check if the dropzone (empty state) is visible
   */
  async isDropzoneVisible(): Promise<boolean> {
    return await this.dropzoneTitle.isVisible().catch(() => false);
  }

  /**
   * Check if the workspace has files (active state)
   */
  async hasFilesInQueue(): Promise<boolean> {
    const queueCount = await this.getQueueCount();
    return queueCount > 0;
  }

  /**
   * Select an upscale mode with better error handling
   */
  async selectMode(mode: UpscaleMode): Promise<void> {
    // Try buttons first (common UI pattern)
    const modeButton = this.page
      .locator(`button[data-mode="${mode}"], button:has-text("${mode}")`)
      .first();

    if (await modeButton.isVisible().catch(() => false)) {
      await modeButton.click();
      return;
    }

    // Try dropdown selector
    if (await this.modeSelector.isVisible().catch(() => false)) {
      await this.modeSelector.selectOption({ label: mode });
      return;
    }

    throw new Error(`Could not find mode selector for mode: ${mode}`);
  }

  /**
   * Click the process/upscale button with validation
   */
  async clickProcess(): Promise<void> {
    // Ensure button is visible and enabled
    await this.waitHelper.waitForProcessButtonEnabled();
    await this.processButton.click();
  }

  /**
   * Wait for processing to start with semantic waits
   */
  async waitForProcessingStart(): Promise<void> {
    await this.waitHelper.waitForProcessingStart();
  }

  /**
   * Wait for processing to complete (success or error)
   */
  async waitForProcessingComplete(): Promise<void> {
    await this.waitHelper.waitForProcessingComplete();
  }

  /**
   * Check if processing is currently active
   */
  async isProcessing(): Promise<boolean> {
    return await this.waitHelper.isProcessing();
  }

  /**
   * Assert the result is visible after processing
   */
  async assertResultVisible(): Promise<void> {
    // Wait for download button or success indicator
    await this.waitHelper.waitForDownloadAvailable();

    // Additional verification for result visibility
    const resultIndicators = [
      this.downloadButton,
      this.page.locator('img[src*="data:image"]'),
      this.successIndicator,
      this.page.locator('.preview-result'),
    ];

    let anyVisible = false;
    for (const indicator of resultIndicators) {
      if (await indicator.isVisible().catch(() => false)) {
        anyVisible = true;
        break;
      }
    }

    if (!anyVisible) {
      throw new Error('No result indicators are visible after processing');
    }
  }

  /**
   * Assert download button is available using semantic wait
   */
  async assertDownloadAvailable(): Promise<void> {
    await this.waitHelper.waitForDownloadAvailable();
  }

  /**
   * Click download button with validation
   */
  async clickDownload(): Promise<void> {
    const downloadButton = await this.waitHelper.waitForDownloadAvailable();
    await downloadButton.click();
  }

  /**
   * Assert an error message is displayed with semantic wait
   */
  async assertErrorVisible(expectedText?: string): Promise<void> {
    const errorMessage = await this.waitHelper.waitForErrorMessage();

    if (expectedText) {
      const errorText = await errorMessage.textContent();
      expect(errorText).toContain(expectedText);
    }
  }

  /**
   * Clear the queue with validation
   */
  async clearQueue(): Promise<void> {
    // Only clear if button is visible
    if (await this.clearButton.isVisible().catch(() => false)) {
      await this.clearButton.click();
      // Wait for dropzone to reappear
      await this.waitHelper.waitForDropzoneVisible();
    }
  }

  /**
   * Get the number of items in the queue with improved reliability
   */
  async getQueueCount(): Promise<number> {
    // Use multiple selectors to find queue items
    const queueItemSelectors = [
      '.border-t.border-slate-200 img',
      '.h-32.bg-white.border-t img',
      '[data-testid="queue-item"]',
      '.queue-item img',
    ];

    let maxCount = 0;
    for (const selector of queueItemSelectors) {
      try {
        const count = await this.page.locator(selector).count();
        maxCount = Math.max(maxCount, count);
      } catch {
        // Continue to next selector
      }
    }

    return maxCount;
  }

  /**
   * Assert the queue is empty using semantic wait
   */
  async assertQueueEmpty(): Promise<void> {
    await this.waitHelper.waitForDropzoneVisible();

    const queueCount = await this.getQueueCount();
    expect(queueCount).toBe(0);
  }

  /**
   * Assert the upgrade modal appears with improved selector
   */
  async assertUpgradeModalVisible(): Promise<void> {
    const upgradeModal = this.page
      .locator(['[data-testid="upgrade-modal"]', '[role="dialog"]', '.modal'].join(', '))
      .filter({ hasText: /upgrade|pricing|credits/i })
      .first();

    await expect(upgradeModal).toBeVisible({ timeout: 5000 });
  }

  /**
   * Get the completion count text with fallback
   */
  async getCompletedCount(): Promise<string> {
    const countSelectors = [
      '[data-testid="completed-count"]',
      ':has-text("completed")',
      '.completion-count',
    ];

    for (const selector of countSelectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible().catch(() => false)) {
          const text = await element.textContent();
          if (text) {
            return text;
          }
        }
      } catch {
        // Continue to next selector
      }
    }

    return '';
  }

  /**
   * Wait for file upload validation to complete
   */
  async waitForFileValidation(): Promise<void> {
    // Wait for any validation messages to appear/disappear
    await this.page.waitForTimeout(500);
    await this.waitHelper.waitForUiStable();
  }

  /**
   * Check if file validation shows any errors
   */
  async hasValidationError(): Promise<boolean> {
    const validationErrorSelectors = [
      '.text-red-600',
      '[role="alert"]',
      '.error-message',
      '.validation-error',
    ];

    for (const selector of validationErrorSelectors) {
      const element = this.page.locator(selector).first();
      const isVisible = await element.isVisible().catch(() => false);
      const hasText = await element
        .textContent()
        .then(text => text && text.trim().length > 0)
        .catch(() => false);

      if (isVisible && hasText) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get validation error message if present
   */
  async getValidationErrorMessage(): Promise<string | null> {
    if (!(await this.hasValidationError())) {
      return null;
    }

    const errorElement = await this.waitHelper.waitForErrorMessage(2000);
    return await errorElement.textContent().catch(() => null);
  }

  /**
   * Retry processing with improved error handling
   */
  async retryProcessing(): Promise<void> {
    if (await this.retryButton.isVisible().catch(() => false)) {
      await this.retryButton.click();
      await this.waitHelper.waitForProcessingStart();
    } else {
      throw new Error('Retry button is not visible');
    }
  }

  /**
   * Check if the page is in a stable state (no active operations)
   */
  async isStable(): Promise<boolean> {
    const isProcessing = await this.isProcessing();
    const isLoading = await this.page
      .locator('[data-loading], .loading')
      .isVisible()
      .catch(() => false);

    return !isProcessing && !isLoading;
  }

  /**
   * Wait for page to reach stable state
   */
  async waitForStableState(timeout = 5000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await this.isStable()) {
        return;
      }
      await this.page.waitForTimeout(100);
    }

    throw new Error('Page did not reach stable state within timeout');
  }
}
