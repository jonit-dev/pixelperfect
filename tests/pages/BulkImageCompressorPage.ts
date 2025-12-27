import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export type ICompressorFormat = 'jpeg' | 'png' | 'webp';

export interface ICompressSettings {
  quality: number;
  targetSizeKB: number;
  format: ICompressorFormat;
}

/**
 * Bulk Image Compressor Page Object
 *
 * Page Object for the bulk image compressor tool at /tools/compress/bulk-image-compressor
 * Provides methods to interact with all UI elements including:
 * - Drag & drop upload
 * - Quality slider
 * - Target size input
 * - Output format selection
 * - Image list with compression ratios
 * - Download buttons (individual and ZIP)
 */
export class BulkImageCompressorPage extends BasePage {
  // Tool component container - the actual BulkImageCompressor component
  readonly toolContainer: Locator;

  // Page elements
  readonly pageTitle: Locator;
  readonly pageDescription: Locator;

  // Settings panel - use ID selectors for reliability
  readonly qualitySlider: Locator;
  readonly qualityDisplay: Locator;
  readonly targetSizeInput: Locator;
  readonly formatSelect: Locator;

  // Upload area
  readonly uploadArea: Locator;
  readonly fileInput: Locator;
  readonly selectImagesButton: Locator;
  readonly addMoreButton: Locator;
  readonly addMoreFileInput: Locator;

  // Action buttons - scoped to tool container
  readonly compressAllButton: Locator;
  readonly downloadAllButton: Locator;
  readonly clearAllButton: Locator;

  // Image list container
  readonly imageListContainer: Locator;

  // Summary stats
  readonly summaryStats: Locator;

  constructor(page: Page) {
    super(page);

    // Tool component container - the actual BulkImageCompressor component
    // This is the max-w-5xl wrapper that contains all the tool UI
    this.toolContainer = page.locator('.max-w-5xl').first();

    // Page header - target the main H1 in the template (text-4xl in hero section)
    this.pageTitle = page
      .locator('h1.text-4xl, h1.text-5xl')
      .filter({ hasText: /bulk image compressor/i })
      .first();

    // Page description - target ONLY the hero intro paragraph (py-8 section, text-xl)
    // Using first() to handle multiple matches
    this.pageDescription = page.locator('.py-8 p.text-xl').first();

    // Settings panel - use global ID selectors (IDs are unique per page)
    this.qualitySlider = page.locator('input#quality');
    // Quality display is the container div that has both label and percentage span
    this.qualityDisplay = page.locator('label[for="quality"]').locator('xpath=..');
    this.targetSizeInput = page.locator('input#targetSize');
    this.formatSelect = page.locator('select#format');

    // Upload area - target the dropzone with specific content
    this.uploadArea = page
      .locator('.border-dashed')
      .filter({ hasText: /drop images here|click to upload/i })
      .first();
    // File input - use page-level locator since upload area may disappear after first upload
    this.fileInput = page.locator('input[type="file"][accept*="image"]').first();
    this.selectImagesButton = this.uploadArea.getByRole('button', { name: /select images/i });
    this.addMoreButton = this.toolContainer.getByRole('button', { name: /add more images/i });
    // Add more file input - may be a different input element after initial upload
    this.addMoreFileInput = page.locator('input[type="file"][accept*="image"]').first();

    // Action buttons - scoped to tool container to avoid pSEO template elements
    this.compressAllButton = this.toolContainer.getByRole('button', {
      name: /compress \d+ image/i,
    });
    this.downloadAllButton = this.toolContainer.getByRole('button', {
      name: /download all as zip/i,
    });
    this.clearAllButton = this.toolContainer.getByRole('button', { name: /clear all/i });

    // Image list container - within the tool component, look for the scrollable area with max-h-96
    // This ensures we only get the tool's image list, not pSEO template elements
    this.imageListContainer = this.toolContainer.locator('.max-h-96.overflow-y-auto, .max-h-96');

    // Summary stats - within the tool component, look for the stats grid
    this.summaryStats = this.toolContainer
      .locator('.grid.grid-cols-4')
      .filter({ hasText: /images|original|compressed/i });
  }

  /**
   * Navigate to the bulk image compressor page
   */
  async goto(): Promise<void> {
    await super.goto('/tools/compress/bulk-image-compressor');
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
    // Set files directly on the hidden file input
    await this.fileInput.setInputFiles(filePaths);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Add more images after initial upload
   */
  async addMoreImages(filePaths: string[]): Promise<void> {
    // Click the "Add More Images" button to trigger the file input
    await this.addMoreButton.click();
    await this.page.waitForTimeout(100);
    // Set files on the file input
    await this.addMoreFileInput.setInputFiles(filePaths);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Upload a single image
   */
  async uploadImage(filePath: string): Promise<void> {
    await this.uploadImages([filePath]);
  }

  /**
   * Click "Select Images" button to open file picker
   */
  async clickSelectImages(): Promise<void> {
    await this.selectImagesButton.click();
  }

  /**
   * Set quality slider value
   */
  async setQuality(quality: number): Promise<void> {
    // Use Playwright's fill method for range inputs, which handles React properly
    await this.qualitySlider.fill(quality.toString());
    await this.page.waitForTimeout(300);
  }

  /**
   * Set target size (0 means no target size)
   */
  async setTargetSize(kb: number): Promise<void> {
    await this.targetSizeInput.fill(kb === 0 ? '' : kb.toString());
    await this.page.waitForTimeout(200);
  }

  /**
   * Set output format
   */
  async setFormat(format: ICompressorFormat): Promise<void> {
    await this.formatSelect.selectOption(format);
    await this.page.waitForTimeout(200);
  }

  /**
   * Get current settings
   */
  async getSettings(): Promise<ICompressSettings> {
    const quality = await this.qualitySlider.inputValue();
    const targetSize = await this.targetSizeInput.inputValue();
    const format = await this.formatSelect.inputValue();

    return {
      quality: parseInt(quality) || 0,
      targetSizeKB: parseInt(targetSize) || 0,
      format: format as ICompressorFormat,
    };
  }

  /**
   * Click "Compress All" button
   */
  async clickCompressAll(): Promise<void> {
    await this.compressAllButton.click();
  }

  /**
   * Click "Download All as ZIP" button
   */
  async clickDownloadAll(): Promise<void> {
    await this.downloadAllButton.click();
  }

  /**
   * Click "Clear All" button
   */
  async clickClearAll(): Promise<void> {
    await this.clearAllButton.click();
  }

  /**
   * Get the image items in the list (items with file info)
   */
  private getImageItems(): Locator {
    // Image items have a Remove button with title="Remove"
    // Structure: image-item > actions-div > remove-button
    // So we need to go up two levels from the button to get the image item
    return this.page
      .locator('button[title="Remove"]')
      .locator(
        'xpath=ancestor::div[contains(@class, "flex") and contains(@class, "items-center") and contains(@class, "gap-4")]'
      );
  }

  /**
   * Get the number of images in the list
   */
  async getImageCount(): Promise<number> {
    await this.page.waitForTimeout(500);
    return await this.getImageItems().count();
  }

  /**
   * Get image info for a specific index
   */
  async getImageInfo(index: number): Promise<{
    name: string | null;
    originalSize: string | null;
    compressedSize: string | null;
    compressionRatio: string | null;
  }> {
    const item = this.getImageItems().nth(index);

    // Get the full text content of the item
    const fullText = await item.textContent();

    // Name is in first paragraph - look for the file name pattern
    const name = await item.locator('p').first().textContent();

    // Extract original size - look for KB pattern in the text
    const originalSizeMatch = fullText?.match(/(\d+)\s*KB/);
    const originalSize = originalSizeMatch?.[0] || null;

    // Look for compressed size (after arrow) and ratio
    const compressedMatch = fullText?.match(/→\s*(\d+)\s*KB/);
    const compressedSize = compressedMatch ? `${compressedMatch[1]}KB` : null;

    const ratioMatch = fullText?.match(/\((-?\d+)%\)/);
    const compressionRatio = ratioMatch ? `${ratioMatch[1]}%` : null;

    return {
      name,
      originalSize,
      compressedSize,
      compressionRatio,
    };
  }

  /**
   * Remove an image by its index (0-based)
   */
  async removeImageByIndex(index: number): Promise<void> {
    const item = this.getImageItems().nth(index);
    // Find the X button (button with no text, before download button)
    const buttons = item.locator('button');
    const buttonCount = await buttons.count();

    // The X/remove button should come before the download button
    // Click the first button that has no visible text (icon button)
    for (let i = 0; i < buttonCount; i++) {
      const btn = buttons.nth(i);
      const text = await btn.textContent();
      if (!text || text.trim() === '') {
        await btn.click();
        await this.page.waitForTimeout(500);
        return;
      }
    }
  }

  /**
   * Click download button for a specific image by index
   */
  async downloadImageByIndex(index: number): Promise<void> {
    const item = this.getImageItems().nth(index);
    // Find the download button - should have Download icon (lucide-react Download)
    // This is typically the first button with download functionality
    const buttons = item.locator('button');
    const buttonCount = await buttons.count();

    // Look for button that might be the download one (after compression, before remove)
    // Try to click based on position or use a more specific selector
    for (let i = buttonCount - 1; i >= 0; i--) {
      const btn = buttons.nth(i);
      const classList = (await btn.getAttribute('class')) || '';
      // The download button typically has text-accent class
      if (classList.includes('text-accent')) {
        await btn.click();
        return;
      }
    }
  }

  /**
   * Wait for processing to complete for all images
   */
  async waitForProcessingComplete(): Promise<void> {
    // Wait for download all button to appear
    await expect(this.downloadAllButton).toBeVisible({ timeout: 120000 });
  }

  /**
   * Wait for summary stats to be visible
   */
  async waitForSummaryStats(): Promise<void> {
    await expect(this.summaryStats).toBeVisible({ timeout: 120000 });
  }

  /**
   * Check if download all button is visible
   */
  async isDownloadAllVisible(): Promise<boolean> {
    return await this.downloadAllButton.isVisible().catch(() => false);
  }

  /**
   * Assert the upload area is visible
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
      .or(this.page.getByText(/processing|compressing/i));
    return await processingIndicator.isVisible().catch(() => false);
  }

  /**
   * Get summary statistics
   */
  async getSummaryStats(): Promise<{
    imageCount: number;
    originalSize: string | null;
    compressedSize: string | null;
    avgReduction: string | null;
  }> {
    const text = await this.summaryStats.textContent();

    // Extract stats (format varies, look for key patterns)
    const imageCountMatch = text?.match(/(\d+)\s*images/i);
    const originalSizeMatch = text?.match(/(\d+\.?\d*)\s*KB/i);
    const reductionMatch = text?.match(/(\d+)%/);

    return {
      imageCount: parseInt(imageCountMatch?.[1] || '0') || 0,
      originalSize: originalSizeMatch?.[1] || null,
      compressedSize: null, // Would need more specific parsing
      avgReduction: reductionMatch ? `${reductionMatch[1]}%` : null, // Include % sign
    };
  }
}
