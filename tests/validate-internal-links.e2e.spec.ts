#!/usr/bin/env tsx
/**
 * Internal Link Validator for pSEO Pages
 *
 * Uses Playwright to validate internal links across pSEO pages:
 * - Checks that related* arrays reference existing pages
 * - Verifies links don't return 404
 * - Tests navigation between related pages
 *
 * Usage:
 *   npx tsx scripts/validate-internal-links.spec.ts
 *   BASE_URL=https://myimageupscaler.com npx tsx scripts/validate-internal-links.spec.ts
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Valid slugs from each category
const VALID_TOOLS = [
  'ai-background-remover',
  'ai-image-upscaler',
  'ai-photo-enhancer',
  'image-cutout-tool',
  'remove-bg',
  'transparent-background-maker',
];

const VALID_GUIDES = [
  'avif-next-gen-format',
  'bmp-format-guide',
  'gif-animation-guide',
  'heic-format-guide',
  'how-to-upscale-images',
  'raw-photography-guide',
  'svg-vector-guide',
  'tiff-format-guide',
  'webp-format-guide',
];

// Broken references that should be removed
const BROKEN_GUIDES = [
  'print-size-guide',
  'ecommerce-image-requirements',
  'web-performance-images',
  'image-resolution-guide',
  'youtube-thumbnail-best-practices',
  'when-to-use-jpg',
  'print-preparation-guide',
  'format-selection-guide',
  'vector-to-raster-guide',
  'understanding-image-formats',
  'understanding-webp-format',
  'when-to-use-png-vs-jpeg',
  'background-removal-guide',
  'interior-photography-tips',
  'image-compression-guide',
];

const BROKEN_TOOLS = [
  'photo-restoration',
  'bulk-image-upscaler',
  'social-media-scheduler',
  'video-thumbnail-generator',
  'instagram-grid-planner',
  'facebook-ad-creator',
  'image-resizer',
  'resize-image-for-facebook',
  'resize-image-for-instagram',
  'resize-image-for-twitter',
  'resize-image-for-linkedin',
  'png-to-jpg',
  'jpg-to-png',
  'webp-to-png',
  'png-to-webp',
  'webp-to-jpg',
  'jpg-to-webp',
  'convert-png-to-jpeg',
  'convert-webp-to-png',
  'add-transparency-to-images',
  'convert-jpeg-to-webp',
  'convert-png-to-webp',
  'convert-jpeg-to-png',
  'compress-png-files',
  'photo-enhancer',
  'background-remover',
];

interface ILinkValidationResult {
  url: string;
  linkType: 'tool' | 'guide' | 'format' | 'platform' | 'other';
  status: number;
  isValid: boolean;
  issue?: string;
}

const results: ILinkValidationResult[] = [];

test.describe('Internal Link Validation', () => {
  test.beforeAll(async () => {
    console.log(`\n🔍 Starting internal link validation for: ${BASE_URL}\n`);
  });

  // Test valid tool pages exist
  test('Valid tool pages should be accessible', async ({ page }) => {
    for (const slug of VALID_TOOLS) {
      const url = `${BASE_URL}/tools/${slug}`;
      const response = await page.goto(url);

      results.push({
        url,
        linkType: 'tool',
        status: response?.status() || 0,
        isValid: response?.ok() || false,
        issue: response?.ok() ? undefined : `HTTP ${response?.status()}`,
      });

      expect(response?.ok(), `Tool page /tools/${slug} should be accessible`).toBe(true);
    }
  });

  // Test valid guide pages exist
  test('Valid guide pages should be accessible', async ({ page }) => {
    for (const slug of VALID_GUIDES) {
      const url = `${BASE_URL}/guides/${slug}`;
      const response = await page.goto(url);

      results.push({
        url,
        linkType: 'guide',
        status: response?.status() || 0,
        isValid: response?.ok() || false,
        issue: response?.ok() ? undefined : `HTTP ${response?.status()}`,
      });

      expect(response?.ok(), `Guide page /guides/${slug} should be accessible`).toBe(true);
    }
  });

  // Test that broken guide references return 404
  test('Broken guide references should return 404', async ({ page }) => {
    for (const slug of BROKEN_GUIDES) {
      const url = `${BASE_URL}/guides/${slug}`;
      const response = await page.goto(url);

      const isNotFound = response?.status() === 404;
      const pageContent = await page.content();
      const hasNotFoundContent = pageContent.toLowerCase().includes('not found');

      results.push({
        url,
        linkType: 'guide',
        status: response?.status() || 0,
        isValid: false, // These are broken references
        issue: isNotFound ? 'Confirmed broken (404)' : 'Unexpected status',
      });

      expect(isNotFound || hasNotFoundContent, `Broken guide /guides/${slug} should return 404`).toBe(
        true
      );
    }
  });

  // Test that broken tool references return 404
  test('Broken tool references should return 404', async ({ page }) => {
    for (const slug of BROKEN_TOOLS) {
      const url = `${BASE_URL}/tools/${slug}`;
      const response = await page.goto(url);

      const isNotFound = response?.status() === 404;
      const pageContent = await page.content();
      const hasNotFoundContent = pageContent.toLowerCase().includes('not found');

      results.push({
        url,
        linkType: 'tool',
        status: response?.status() || 0,
        isValid: false, // These are broken references
        issue: isNotFound ? 'Confirmed broken (404)' : 'Unexpected status',
      });

      expect(isNotFound || hasNotFoundContent, `Broken tool /tools/${slug} should return 404`).toBe(
        true
      );
    }
  });

  // Test related pages section on a sample page
  test('Related pages should contain valid links', async ({ page }) => {
    const url = `${BASE_URL}/tools/ai-image-upscaler`;
    await page.goto(url);

    // Find all links in the related pages section
    const relatedLinks = page.locator('a[href*="/tools/"], a[href*="/guides/"]');

    const count = await relatedLinks.count();
    console.log(`\n📄 Found ${count} related links on ${url}`);

    for (let i = 0; i < count; i++) {
      const link = relatedLinks.nth(i);
      const href = await link.getAttribute('href');

      if (href) {
        const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
        const slug = fullUrl.split('/').pop();

        // Check if it's a valid reference
        const isValid = [...VALID_TOOLS, ...VALID_GUIDES].includes(slug || '');
        const isBroken = [...BROKEN_TOOLS, ...BROKEN_GUIDES].includes(slug || '');

        results.push({
          url: fullUrl,
          linkType: fullUrl.includes('/tools/') ? 'tool' : 'guide',
          status: 0,
          isValid: isValid || !isBroken,
          issue: isBroken ? 'Broken link found in page' : undefined,
        });

        if (isBroken) {
          console.log(`  ❌ Broken link found: ${href}`);
        }
      }
    }
  });

  test.afterAll(async () => {
    console.log('\n' + '='.repeat(70));
    console.log('              INTERNAL LINK VALIDATION REPORT');
    console.log('='.repeat(70));

    const validLinks = results.filter(r => r.isValid);
    const brokenLinks = results.filter(r => !r.isValid);

    console.log(`\nTotal links checked: ${results.length}`);
    console.log(`✅ Valid links: ${validLinks.length}`);
    console.log(`❌ Broken links: ${brokenLinks.length}\n`);

    if (brokenLinks.length > 0) {
      console.log('❌ BROKEN LINKS FOUND:\n');
      for (const link of brokenLinks) {
        console.log(`  ${link.url}`);
        console.log(`    Type: ${link.linkType} | Issue: ${link.issue}\n`);
      }
    }

    console.log('='.repeat(70) + '\n');

    if (brokenLinks.length > 0) {
      console.log('⚠️  Action required: Remove broken references from data files\n');
    } else {
      console.log('🎉 All internal links validated successfully!\n');
    }
  });
});
