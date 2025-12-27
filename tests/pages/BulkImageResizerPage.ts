import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export type IFitMode = 'fit' | 'fill';
export type IOutputFormat = 'jpeg' | 'png' | 'webp';

export interface IResizeSettings {
  width: number;
  height: number;
  maintainAspectRatio: boolean;
  fitMode: IFitMode;
  format: IOutputFormat;
  quality: number;
}

/**
 * Bulk Image Resizer Page Object
 *
 * Page Object for the bulk image resizer tool at /tools/resize/bulk-image-resizer
 * Provides methods to interact with all UI elements including:
 * - Drag & drop upload
 * - Settings panel (width, height, format, quality, aspect ratio)
 * - Image list with progress indicators
 * - Download buttons (individual and ZIP)
 */
export class BulkImageResizerPage extends BasePage {
  // Page elements
  readonly pageTitle: Locator;
  readonly pageDescription: Locator;

  // Settings panel - use ID selectors for reliability
  readonly widthInput: Locator;
  readonly heightInput: Locator;
  readonly formatSelect: Locator;
  readonly qualitySlider: Locator;
  readonly qualityDisplay: Locator;
  readonly aspectRatioCheckbox: Locator;
  readonly fitModeSelect: Locator;

  // Upload area
  readonly uploadArea: Locator;
  readonly fileInput: Locator;
  readonly addMoreButton: Locator;

  // Action buttons
  readonly processAllButton: Locator;
  readonly downloadAllButton: Locator;
  readonly resetButton: Locator;

  // Image list container
  readonly imageListContainer: Locator;

  constructor(page: Page) {
    super(page);

    // Page header - target the main H1 in the template (text-4xl in hero section)
    this.pageTitle = page
      .locator('h1.text-4xl, h1.text-5xl')
      .filter({ hasText: /bulk image resizer/i })
      .first();

    // Page description - target ONLY the hero intro paragraph (py-8 section, text-xl)
    this.pageDescription = page.locator('.py-8 p.text-xl').first();

    // Settings panel - use global ID selectors (IDs are unique per page)
    this.widthInput = page.locator('input#width');
    this.heightInput = page.locator('input#height');
    this.formatSelect = page.locator('select#format');
    this.qualitySlider = page.locator('input#quality');
    this.qualityDisplay = page.locator('label[for="quality"]');
    this.aspectRatioCheckbox = page.locator('input#aspect-ratio');
    this.fitModeSelect = page.locator('select#fit-mode');

    // Upload area - target the dropzone with specific content
    this.uploadArea = page
      .locator('.border-dashed')
      .filter({ hasText: /drag & drop/i })
      .first();
    this.fileInput = page.locator('input[type="file"][accept*="image"]').first();
    this.addMoreButton = page.getByRole('button', { name: /add more images/i });

    // Action buttons
    this.processAllButton = page.getByRole('button', { name: /process all/i });
    this.downloadAllButton = page.getByRole('button', { name: /download all as zip/i });
    this.resetButton = page.getByRole('button', { name: /reset/i });

    // Image list container - the scrollable area containing image items
    this.imageListContainer = page.locator('.space-y-3.mb-6.max-h-\\[400px\\]');
  }

  /**
   * Navigate to the bulk image resizer page
   */
  async goto(): Promise<void> {
    await super.goto('/tools/resize/bulk-image-resizer');
  }

  /**
   * Wait for the page to load
   */
  async waitForLoad(): Promise<void> {
    await expect(this.pageTitle).toBeVisible({ timeout: 15000 });
    await expect(this.uploadArea).toBeVisible({ timeout: 10000 });
  }

  /**
   * Upload image(s) via the file input
   */
  async uploadImages(filePaths: string[]): Promise<void> {
    await this.fileInput.setInputFiles(filePaths);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Upload a single image
   */
  async uploadImage(filePath: string): Promise<void> {
    await this.uploadImages([filePath]);
  }

  /**
   * Add more images after initial upload
   */
  async addMoreImages(filePaths: string[]): Promise<void> {
    // Click the "Add More Images" button to trigger the file input
    await this.addMoreButton.click();
    await this.page.waitForTimeout(100);
    // Set files on the file input
    await this.fileInput.setInputFiles(filePaths);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Set width
   */
  async setWidth(width: number): Promise<void> {
    await this.widthInput.fill(width.toString());
  }

  /**
   * Set height - first disables aspect ratio if needed since height is disabled when aspect ratio is on
   */
  async setHeight(height: number): Promise<void> {
    // Check if height is disabled (aspect ratio is on) and disable it first
    const isDisabled = await this.heightInput.isDisabled();
    if (isDisabled) {
      await this.setMaintainAspectRatio(false);
    }
    await this.heightInput.fill(height.toString());
  }

  /**
   * Set output format
   */
  async setFormat(format: IOutputFormat): Promise<void> {
    await this.formatSelect.selectOption(format);
  }

  /**
   * Set quality slider value
   */
  async setQuality(quality: number): Promise<void> {
    // Using JS to set range value directly for more reliable testing
    await this.qualitySlider.evaluate((el: HTMLInputElement, val) => {
      el.value = val.toString();
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, quality);
    await this.page.waitForTimeout(200);
  }

  /**
   * Toggle maintain aspect ratio checkbox
   */
  async setMaintainAspectRatio(checked: boolean): Promise<void> {
    const isChecked = await this.aspectRatioCheckbox.isChecked();
    if (isChecked !== checked) {
      await this.aspectRatioCheckbox.setChecked(checked);
      await this.page.waitForTimeout(200);
    }
  }

  /**
   * Set fit mode (only available when aspect ratio is maintained)
   */
  async setFitMode(mode: IFitMode): Promise<void> {
    // Ensure aspect ratio checkbox is checked first
    await this.setMaintainAspectRatio(true);
    await this.fitModeSelect.selectOption(mode);
    await this.page.waitForTimeout(200);
  }

  /**
   * Get current settings
   */
  async getSettings(): Promise<IResizeSettings> {
    const width = await this.widthInput.inputValue();
    const height = await this.heightInput.inputValue();
    const format = await this.formatSelect.inputValue();
    const quality = await this.qualitySlider.inputValue();
    const maintainAspectRatio = await this.aspectRatioCheckbox.isChecked();

    // Fit mode select might not be visible if aspect ratio is not maintained
    let fitMode: IFitMode = 'fit';
    try {
      if (maintainAspectRatio) {
        const fitModeValue = await this.fitModeSelect.inputValue();
        fitMode = fitModeValue as IFitMode;
      }
    } catch {
      // Fit mode select might not be visible
    }

    return {
      width: parseInt(width) || 0,
      height: parseInt(height) || 0,
      maintainAspectRatio,
      fitMode,
      format: format as IOutputFormat,
      quality: parseInt(quality) || 0,
    };
  }

  /**
   * Click "Process All" button
   */
  async clickProcessAll(): Promise<void> {
    await this.processAllButton.click();
  }

  /**
   * Click "Download All as ZIP" button
   */
  async clickDownloadAll(): Promise<void> {
    await this.downloadAllButton.click();
  }

  /**
   * Click "Reset" button
   */
  async clickReset(): Promise<void> {
    await this.resetButton.click();
  }

  /**
   * Get the image items in the list (items with file info)
   */
  private getImageItems(): Locator {
    // Image items are in the scrollable container, each has thumbnail, file name, and dimension info
    return this.imageListContainer.locator('.bg-surface-light\\/50.rounded-lg');
  }

  /**
   * Get the number of images in the list
   */
  async getImageCount(): Promise<number> {
    await this.page.waitForTimeout(500);
    return await this.getImageItems().count();
  }

  /**
   * Remove an image by its index (0-based)
   */
  async removeImageByIndex(index: number): Promise<void> {
    const item = this.getImageItems().nth(index);
    // Find the remove button (has title="Remove")
    const removeButton = item.locator('button[title="Remove"]');
    await removeButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Click download button for a specific image by index
   */
  async downloadImageByIndex(index: number): Promise<void> {
    const item = this.getImageItems().nth(index);
    // Find the download button (has title attribute or download icon)
    const downloadButton = item
      .locator('button')
      .filter({ has: this.page.locator('svg.lucide-download') });
    await downloadButton.click();
  }

  /**
   * Wait for processing to complete for all images
   */
  async waitForProcessingComplete(): Promise<void> {
    // Wait for download all button to appear
    await expect(this.downloadAllButton).toBeVisible({ timeout: 60000 });
  }

  /**
   * Check if download all button is visible
   */
  async isDownloadAllVisible(): Promise<boolean> {
    return await this.downloadAllButton.isVisible().catch(() => false);
  }

  /**
   * Assert the queue is empty (upload area visible)
   */
  async assertUploadAreaVisible(): Promise<void> {
    await expect(this.uploadArea).toBeVisible({ timeout: 5000 });
  }

  /**
   * Assert the upload area is hidden (images have been added)
   */
  async assertUploadAreaHidden(): Promise<void> {
    await expect(this.uploadArea).not.toBeVisible({ timeout: 5000 });
  }

  /**
   * Check if processing is in progress
   */
  async isProcessing(): Promise<boolean> {
    const processingIndicator = this.page
      .locator('.animate-spin')
      .or(this.page.getByText(/processing/i));
    return await processingIndicator.isVisible().catch(() => false);
  }

  /**
   * Get image info for a specific index (name, dimensions)
   */
  async getImageInfo(index: number): Promise<{ name: string | null; dimensions: string | null }> {
    const item = this.getImageItems().nth(index);

    const name = await item.locator('.text-sm.font-medium.text-text-primary').textContent();
    // Target specifically the <p> element, not buttons, for dimensions
    const dimensions = await item.locator('p.text-xs.text-text-secondary').textContent();

    return { name, dimensions };
  }
}
