import { test, expect } from '../test-fixtures';
import { BulkImageCompressorPage } from '../pages/BulkImageCompressorPage';
import { getFixturePath } from '../fixtures';

/**
 * Bulk Image Compressor E2E Tests
 *
 * Tests for the bulk image compressor tool at /tools/compress/bulk-image-compressor
 * Features tested:
 * - Multi-file drag & drop upload (up to 20 images)
 * - Quality slider (1-100%)
 * - Target size input (KB)
 * - Output format selection (JPEG, WebP, PNG)
 * - Individual progress bars
 * - Original vs compressed size display
 * - Compression ratio display
 * - Download as ZIP button
 */

test.describe('Bulk Image Compressor E2E Tests', () => {
  const sampleImagePath = getFixturePath('sample.jpg');
  const sampleImagePath2 = getFixturePath('sample2.jpg');

  test.describe('Page Structure', () => {
    test('Page loads with correct title and upload area', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      // Verify page elements
      await expect(compressorPage.pageTitle).toBeVisible();
      await expect(compressorPage.pageDescription).toBeVisible();
      await expect(compressorPage.uploadArea).toBeVisible();
    });

    test('Settings panel has all controls', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      // Verify all settings controls are present
      await expect(compressorPage.qualitySlider).toBeVisible();
      await expect(compressorPage.targetSizeInput).toBeVisible();
      await expect(compressorPage.formatSelect).toBeVisible();
    });

    test('Upload area shows correct instructions', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      // Verify upload instructions - scope to the upload area to avoid multiple matches
      await expect(compressorPage.uploadArea).toContainText(/drop images|click to upload/i);
      await expect(compressorPage.uploadArea).toContainText(/up to \d+ images/i);
    });
  });

  test.describe('Image Upload Flow', () => {
    test('Uploading a single image shows in list', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      // Upload image (waitForImagesLoaded is called internally)
      await compressorPage.uploadImage(sampleImagePath);

      // Verify upload area is hidden and image is in list
      await compressorPage.assertUploadAreaHidden();

      const imageCount = await compressorPage.getImageCount();
      expect(imageCount).toBe(1);
    });

    test('Uploading multiple images shows all in list', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      // Upload multiple images (waitForImagesLoaded is called internally)
      await compressorPage.uploadImages([sampleImagePath, sampleImagePath2]);

      // Verify images are in list
      const imageCount = await compressorPage.getImageCount();
      expect(imageCount).toBeGreaterThanOrEqual(2);
    });

    test('Can add more images after initial upload', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      // Upload first image
      await compressorPage.uploadImage(sampleImagePath);

      const initialCount = await compressorPage.getImageCount();

      // Add more images using the "Add More Images" button (waits for count internally)
      await compressorPage.addMoreImages([sampleImagePath2]);

      const finalCount = await compressorPage.getImageCount();
      expect(finalCount).toBe(initialCount + 1);
    });

    test('Image shows preview and original size', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      await compressorPage.uploadImage(sampleImagePath);

      // Get image info
      const info = await compressorPage.getImageInfo(0);

      // Verify name exists
      expect(info.name).toBeTruthy();
      expect(info.name?.length).toBeGreaterThan(0);

      // Verify original size is shown (format like "500KB")
      expect(info.originalSize).toBeTruthy();
      expect(info.originalSize).toMatch(/\d+\.?\d*\s*KB/i);
    });
  });

  test.describe('Settings Controls', () => {
    test('Can set quality slider', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      // Set quality to different values (setQuality waits for value internally)
      const qualities = [50, 75, 95];

      for (const quality of qualities) {
        await compressorPage.setQuality(quality);

        const value = await compressorPage.qualitySlider.inputValue();
        expect(parseInt(value)).toBe(quality);
      }
    });

    test('Quality display updates when slider changes', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      // Set quality (waits for value internally)
      await compressorPage.setQuality(85);

      // Look for quality display in the label (e.g., "Quality: 85%")
      await expect(compressorPage.qualityDisplay).toContainText('85%');
    });

    test('Can set target size in KB', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      // Set target size (waits for value internally)
      await compressorPage.setTargetSize(500);

      // Verify target size was set
      const value = await compressorPage.targetSizeInput.inputValue();
      expect(value).toBe('500');
    });

    test('Can clear target size by setting to 0', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      // Set target size first
      await compressorPage.setTargetSize(500);

      // Clear it
      await compressorPage.setTargetSize(0);

      // Verify it was cleared (empty or 0)
      const value = await compressorPage.targetSizeInput.inputValue();
      expect(value === '' || value === '0').toBe(true);
    });

    test('Can set output format', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      // Test all formats (setFormat waits for value internally)
      const formats: Array<'jpeg' | 'png' | 'webp'> = ['jpeg', 'png', 'webp'];

      for (const format of formats) {
        await compressorPage.setFormat(format);

        const selectedValue = await compressorPage.formatSelect.inputValue();
        expect(selectedValue).toBe(format);
      }
    });

    test('Format options include JPEG, WebP, and PNG', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      // Get all available options from the select element
      const options = await compressorPage.formatSelect.locator('option').allTextContents();

      const optionsText = options.join(' ');
      expect(optionsText.toLowerCase()).toContain('jpeg');
      expect(optionsText.toLowerCase()).toContain('webp');
      expect(optionsText.toLowerCase()).toContain('png');
    });
  });

  test.describe('Compression Flow', () => {
    test('Compress button appears after upload', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      await compressorPage.uploadImage(sampleImagePath);

      // Compress All button should be visible
      await expect(compressorPage.compressAllButton).toBeVisible();
    });

    test('Compress button shows correct image count', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      await compressorPage.uploadImages([sampleImagePath, sampleImagePath2]);

      // Button should show "Compress 2 Images" or similar
      await expect(page.getByText(/compress 2 images/i)).toBeVisible();
    });

    test('Clicking Compress processes images', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      await compressorPage.uploadImage(sampleImagePath);

      // Click compress all
      await compressorPage.clickCompressAll();

      // Wait for processing to complete (semantic wait)
      await compressorPage.waitForProcessingComplete();

      // Download button should be visible after completion
      const isComplete = await compressorPage.isDownloadAllVisible();
      expect(isComplete).toBe(true);
    });

    test('Download All as ZIP button appears after processing', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      await compressorPage.uploadImage(sampleImagePath);

      await compressorPage.clickCompressAll();

      // Wait for download button to appear
      await compressorPage.waitForProcessingComplete();

      // Download All button should be visible
      await expect(compressorPage.downloadAllButton).toBeVisible();
    });

    test('Summary stats appear after all images processed', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      await compressorPage.uploadImage(sampleImagePath);

      await compressorPage.clickCompressAll();

      // Wait for summary stats to appear
      await compressorPage.waitForSummaryStats();

      // Summary stats should be visible
      await expect(compressorPage.summaryStats).toBeVisible();
    });
  });

  test.describe('Size and Compression Display', () => {
    test('Original size is displayed for each image', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      await compressorPage.uploadImage(sampleImagePath);

      // Get image info before compression
      const info = await compressorPage.getImageInfo(0);

      // Original size should be shown
      expect(info.originalSize).toBeTruthy();
      expect(info.originalSize).toMatch(/\d+\.?\d*\s*KB/i);
    });

    test('Compressed size is displayed after processing', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      await compressorPage.uploadImage(sampleImagePath);

      await compressorPage.clickCompressAll();
      await compressorPage.waitForProcessingComplete();

      // Get image info after compression
      const info = await compressorPage.getImageInfo(0);

      // Compressed size should be shown
      expect(info.compressedSize).toBeTruthy();
      expect(info.compressedSize).toMatch(/\d+\.?\d*\s*KB/i);
    });

    test('Compression ratio is displayed as percentage', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      await compressorPage.uploadImage(sampleImagePath);

      await compressorPage.clickCompressAll();
      await compressorPage.waitForProcessingComplete();

      // Get image info after compression
      const info = await compressorPage.getImageInfo(0);

      // Compression ratio should be shown (e.g., "-45%")
      expect(info.compressionRatio).toBeTruthy();
      expect(info.compressionRatio).toMatch(/-?\d+%/);
    });

    test('Compressed size is smaller than original', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      await compressorPage.uploadImage(sampleImagePath);

      // Use a relatively low quality to ensure compression
      await compressorPage.setQuality(50);

      await compressorPage.clickCompressAll();
      await compressorPage.waitForProcessingComplete();

      // Get image info
      const info = await compressorPage.getImageInfo(0);

      if (info.originalSize && info.compressedSize) {
        const originalKB = parseFloat(info.originalSize);
        const compressedKB = parseFloat(info.compressedSize);

        // Compressed should be smaller
        expect(compressedKB).toBeLessThan(originalKB);
      }
    });

    test('Summary stats show total savings', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      await compressorPage.uploadImages([sampleImagePath, sampleImagePath2]);

      await compressorPage.clickCompressAll();
      await compressorPage.waitForSummaryStats();

      // Get summary stats
      const stats = await compressorPage.getSummaryStats();

      // Should show total images
      expect(stats.imageCount).toBeGreaterThanOrEqual(2);

      // Should show average reduction
      expect(stats.avgReduction).toBeTruthy();
      expect(stats.avgReduction).toMatch(/\d+%/);
    });
  });

  test.describe('Image Management', () => {
    test('Can remove individual image from list', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      // Upload two images
      await compressorPage.uploadImages([sampleImagePath, sampleImagePath2]);

      const initialCount = await compressorPage.getImageCount();
      expect(initialCount).toBeGreaterThanOrEqual(2);

      // Remove first image (waits for count to decrease internally)
      await compressorPage.removeImageByIndex(0);

      const finalCount = await compressorPage.getImageCount();
      expect(finalCount).toBe(initialCount - 1);
    });

    test('Clear All button removes all images', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      await compressorPage.uploadImages([sampleImagePath, sampleImagePath2]);

      // Verify images are in list
      const initialCount = await compressorPage.getImageCount();
      expect(initialCount).toBeGreaterThanOrEqual(1);

      // Click clear all
      await compressorPage.clickClearAll();

      // Upload area should be visible again
      await compressorPage.assertUploadAreaVisible();
    });

    test('Can download individual compressed image', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      await compressorPage.uploadImage(sampleImagePath);

      await compressorPage.clickCompressAll();
      await compressorPage.waitForProcessingComplete();

      // Set up download listener and click download for first image
      const downloadPromise = page.waitForEvent('download');

      await compressorPage.downloadImageByIndex(0);

      // Verify download was triggered
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('-compressed.');
    });
  });

  test.describe('Target Size Mode', () => {
    test('Setting target size enables target-based compression', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      await compressorPage.uploadImage(sampleImagePath);

      // Set a target size (10KB for our small test image)
      await compressorPage.setTargetSize(10);

      await compressorPage.clickCompressAll();
      await compressorPage.waitForProcessingComplete();

      // Get image info
      const info = await compressorPage.getImageInfo(0);

      // Compressed size should exist and be a valid number
      expect(info.compressedSize).toBeTruthy();
      if (info.compressedSize) {
        const compressedKB = parseFloat(info.compressedSize);
        // Compressed size should be a reasonable value (not 0, not huge)
        expect(compressedKB).toBeGreaterThan(0);
        expect(compressedKB).toBeLessThan(50);
      }
    });
  });

  test.describe('Accessibility', () => {
    test('Page has proper semantic structure', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      // Check for proper heading structure
      const headings = page.locator('h1, h2, h3');
      await expect(headings.first()).toBeVisible();

      // Check for form labels - only check visible inputs with IDs (skip file inputs and hidden inputs)
      const inputs = page.locator(
        'input:visible:not([type="file"]):not([type="hidden"]), select:visible'
      );
      const inputCount = await inputs.count();

      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const hasLabel = await input.evaluate(el => {
          const id = el.id;
          // Skip elements without ID - they can't have a label[for] association
          if (!id) return true;
          const ariaLabel = el.getAttribute('aria-label');
          const ariaLabelledBy = el.getAttribute('aria-labelledby');
          const label = document.querySelector(`label[for="${id}"]`);

          return !!(ariaLabel || ariaLabelledBy || label);
        });

        expect(hasLabel).toBe(true);
      }
    });

    test('Buttons have accessible names', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      // Upload an image to show action buttons
      await compressorPage.uploadImage(sampleImagePath);

      // Check that buttons have text content, aria-label, or title
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const title = await button.getAttribute('title');

        // Button is accessible if it has visible text, aria-label, or title
        const hasAccessibleName = !!(text?.trim() || ariaLabel || title);
        expect(hasAccessibleName).toBe(true);
      }
    });

    test('Quality slider shows current value', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      // Change quality (waits for value internally)
      await compressorPage.setQuality(75);

      // Quality display should show the value in the label
      await expect(compressorPage.qualityDisplay).toContainText('75%');
    });
  });

  test.describe('Performance', () => {
    test('Page loads within reasonable time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/tools/compress/bulk-image-compressor');
      await page.waitForLoadState('domcontentloaded');

      const loadTime = Date.now() - startTime;

      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('Settings updates are responsive', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      const startTime = Date.now();

      // Update several settings
      await compressorPage.setQuality(85);
      await compressorPage.setTargetSize(200);
      await compressorPage.setFormat('webp');

      const updateTime = Date.now() - startTime;

      // Updates should be quick (no lag)
      expect(updateTime).toBeLessThan(2000);
    });
  });

  test.describe('Error Handling', () => {
    test('Non-image files are filtered out', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      // Verify the file input has accept attribute that filters to images only
      const fileInput = page.locator('input[type="file"]').first();
      const acceptAttribute = await fileInput.getAttribute('accept');

      // The accept attribute should only allow image files
      expect(acceptAttribute).toContain('image');
      expect(acceptAttribute).not.toContain('text');
      expect(acceptAttribute).not.toContain('application');
    });
  });

  test.describe('Tips and Help Text', () => {
    test('Tips section is displayed', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      // Look for tips section
      await expect(page.getByText(/tips:/i)).toBeVisible();
    });

    test('Tips include quality recommendations', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      // Look for quality tip text
      await expect(page.getByText(/70-80% quality is optimal/i)).toBeVisible();
    });

    test('Tips include format information', async ({ page }) => {
      const compressorPage = new BulkImageCompressorPage(page);
      await compressorPage.goto();
      await compressorPage.waitForLoad();

      // Look for format tip text
      await expect(page.getByText(/webp format offers best compression/i)).toBeVisible();
    });
  });
});
