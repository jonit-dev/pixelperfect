import type { Page } from '@playwright/test';
import { UpscalerPageEnhanced } from '../pages/UpscalerPage.enhanced';
import { UpscalerMockHelper } from './upscaler-mocks';
import { UpscalerWaitHelper } from './upscaler-waits';
import { getFixturePath } from '../fixtures';

export interface IUpscalerTestConfig {
  autoSetupAuth?: boolean;
  defaultCredits?: number;
  autoMockApi?: boolean;
  mockDelay?: number;
}

/**
 * Comprehensive test helper for upscaler e2e tests
 * Combines page object, mock helper, and wait helper for streamlined testing
 */
export class UpscalerTestHelper {
  public readonly page: UpscalerPageEnhanced;
  public readonly mocks: UpscalerMockHelper;
  public readonly waits: UpscalerWaitHelper;

  constructor(
    private readonly playwrightPage: Page,
    private readonly config: IUpscalerTestConfig = {}
  ) {
    this.page = new UpscalerPageEnhanced(playwrightPage);
    this.mocks = new UpscalerMockHelper(playwrightPage);
    this.waits = new UpscalerWaitHelper(playwrightPage);
  }

  /**
   * Initialize the test environment with standard setup
   */
  async initialize(): Promise<void> {
    // Set up auth mocks if requested
    if (this.config.autoSetupAuth !== false) {
      await this.mocks.setupAuthMocks({
        credits: this.config.defaultCredits || 1000,
      });
    }

    // Set up API mock if requested
    if (this.config.autoMockApi) {
      await this.mocks.mockSuccess(this.config.mockDelay || 500);
    }

    // Navigate to page
    await this.page.goto();
    await this.waits.waitForUiStable();
  }

  /**
   * Upload a single image and wait for it to be processed
   */
  async uploadSingleImage(fileName = 'sample.jpg'): Promise<void> {
    const filePath = getFixturePath(fileName);
    await this.page.uploadImage(filePath);
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(fileNames: string[]): Promise<void> {
    const filePaths = fileNames.map(name => getFixturePath(name));
    await this.page.uploadImages(filePaths);
  }

  /**
   * Complete the standard upload and process flow
   */
  async uploadAndProcess(fileName = 'sample.jpg'): Promise<void> {
    await this.uploadSingleImage(fileName);
    await this.page.clickProcess();
    await this.waits.waitForProcessingComplete();
  }

  /**
   * Set up error scenario
   */
  async setupErrorScenario(
    errorType: 'insufficient-credits' | 'server-error' | 'timeout' | 'custom',
    customError?: any
  ): Promise<void> {
    // Set up auth with appropriate credits
    if (errorType === 'insufficient-credits') {
      await this.mocks.setupAuthMocks({ credits: 0 });
      await this.mocks.mockInsufficientCredits();
    } else {
      await this.mocks.setupAuthMocks({ credits: 1000 });

      switch (errorType) {
        case 'server-error':
          await this.mocks.mockServerError();
          break;
        case 'timeout':
          await this.mocks.mockTimeout();
          break;
        case 'custom':
          if (customError) {
            await this.mocks.mockCustomError(customError);
          }
          break;
      }
    }
  }

  /**
   * Verify successful processing result
   */
  async verifySuccessResult(): Promise<void> {
    await this.page.assertResultVisible();
    await this.page.assertDownloadAvailable();
  }

  /**
   * Verify error result
   */
  async verifyErrorResult(expectedErrorText?: string): Promise<void> {
    await this.page.assertErrorVisible(expectedErrorText);
  }

  /**
   * Get current queue count
   */
  async getQueueCount(): Promise<number> {
    return await this.page.getQueueCount();
  }

  /**
   * Clear the queue
   */
  async clearQueue(): Promise<void> {
    await this.page.clearQueue();
  }

  /**
   * Wait for stable state
   */
  async waitForStableState(): Promise<void> {
    await this.page.waitForStableState();
  }

  /**
   * Take a debug screenshot
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot(`upscaler-${name}`);
  }

  /**
   * Check if file validation shows errors
   */
  async hasValidationError(): Promise<boolean> {
    return await this.page.hasValidationError();
  }

  /**
   * Get validation error message
   */
  async getValidationErrorMessage(): Promise<string | null> {
    return await this.page.getValidationErrorMessage();
  }

  /**
   * Factory method to create a test helper with default config
   */
  static create(page: Page, config: IUpscalerTestConfig = {}): UpscalerTestHelper {
    return new UpscalerTestHelper(page, {
      autoSetupAuth: true,
      autoMockApi: false,
      defaultCredits: 1000,
      mockDelay: 500,
      ...config,
    });
  }

  /**
   * Factory method for success scenario tests
   */
  static forSuccessScenario(page: Page, mockDelay = 500): UpscalerTestHelper {
    return UpscalerTestHelper.create(page, {
      autoSetupAuth: true,
      autoMockApi: true,
      defaultCredits: 1000,
      mockDelay,
    });
  }

  /**
   * Factory method for error scenario tests
   */
  static forErrorScenario(page: Page, credits = 0): UpscalerTestHelper {
    return UpscalerTestHelper.create(page, {
      autoSetupAuth: true,
      autoMockApi: false,
      defaultCredits: credits,
    });
  }

  /**
   * Factory method for basic UI tests (no API mocking)
   */
  static forUiTests(page: Page): UpscalerTestHelper {
    return UpscalerTestHelper.create(page, {
      autoSetupAuth: false,
      autoMockApi: false,
    });
  }
}

/**
 * Test builder pattern for complex upscaler test scenarios
 */
export class UpscalerTestBuilder {
  private helper: UpscalerTestHelper;
  private steps: Array<() => Promise<void>> = [];

  constructor(page: Page, config?: IUpscalerTestConfig) {
    this.helper = UpscalerTestHelper.create(page, config);
  }

  /**
   * Add image upload step
   */
  uploadImage(fileName = 'sample.jpg'): this {
    this.steps.push(async () => {
      await this.helper.uploadSingleImage(fileName);
    });
    return this;
  }

  /**
   * Add multiple image upload step
   */
  uploadImages(fileNames: string[]): this {
    this.steps.push(async () => {
      await this.helper.uploadMultipleImages(fileNames);
    });
    return this;
  }

  /**
   * Add processing step
   */
  process(): this {
    this.steps.push(async () => {
      await this.helper.page.clickProcess();
    });
    return this;
  }

  /**
   * Add wait for completion step
   */
  waitForCompletion(): this {
    this.steps.push(async () => {
      await this.helper.waits.waitForProcessingComplete();
    });
    return this;
  }

  /**
   * Add queue clear step
   */
  clearQueue(): this {
    this.steps.push(async () => {
      await this.helper.clearQueue();
    });
    return this;
  }

  /**
   * Add verification step
   */
  verifySuccess(): this {
    this.steps.push(async () => {
      await this.helper.verifySuccessResult();
    });
    return this;
  }

  /**
   * Add error verification step
   */
  verifyError(expectedText?: string): this {
    this.steps.push(async () => {
      await this.helper.verifyErrorResult(expectedText);
    });
    return this;
  }

  /**
   * Add custom step
   */
  addStep(step: () => Promise<void>): this {
    this.steps.push(step);
    return this;
  }

  /**
   * Execute all steps
   */
  async execute(): Promise<void> {
    await this.helper.initialize();

    for (const step of this.steps) {
      await step();
    }
  }

  /**
   * Get the helper instance for advanced operations
   */
  getHelper(): UpscalerTestHelper {
    return this.helper;
  }
}
