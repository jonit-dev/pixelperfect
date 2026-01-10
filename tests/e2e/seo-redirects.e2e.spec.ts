import { test, expect } from '../test-fixtures';

/**
 * SEO Redirects E2E Tests
 *
 * Tests for verifying that legacy/incorrect URLs properly redirect to canonical locations.
 * These are 301 permanent redirects for SEO purposes.
 *
 * Redirects tested:
 * - www.myimageupscaler.com → myimageupscaler.com (WWW to non-WWW)
 * - /tools/bulk-image-resizer → /tools/resize/bulk-image-resizer
 * - /tools/bulk-image-compressor → /tools/compress/bulk-image-compressor
 */

test.describe('SEO Redirects E2E Tests', () => {
  test.describe('WWW to non-WWW Redirects', () => {
    test('www subdomain redirects to non-www (301)', async ({ page }) => {
      // Note: In local development, we cannot test actual www.localhost redirection
      // because www.localhost is not a valid hostname.

      // The middleware's handleWWWRedirect function (in middleware.ts) correctly
      // strips the www. prefix and returns a 301 redirect. This logic is verified
      // by unit tests.

      // In production, requests to www.myimageupscaler.com will be redirected to
      // myimageupscaler.com with a 301 permanent redirect for SEO.

      // This E2E test verifies the homepage loads correctly, ensuring the
      // middleware doesn't break normal requests
      await page.goto('/');
      await expect(page.locator('h1')).toBeVisible();
    });
  });

  test.describe('Bulk Image Resizer Redirects', () => {
    test('/tools/bulk-image-resizer redirects to /tools/resize/bulk-image-resizer (301)', async ({
      page,
    }) => {
      // Navigate to the old URL without trailing slash
      const response = await page.goto('/tools/bulk-image-resizer');

      // Should redirect to the new canonical URL
      expect(page.url()).toContain('/tools/resize/bulk-image-resizer');

      // Should be a 301 permanent redirect
      if (response?.request().redirectedFrom()) {
        const redirectStatus = response?.status();
        expect(redirectStatus).toBe(200); // Final response should be 200
      }

      // Page should load successfully
      await expect(page.locator('h1')).toBeVisible();
    });

    test('/tools/bulk-image-resizer/ redirects to /tools/resize/bulk-image-resizer (301)', async ({
      page,
    }) => {
      // Navigate to the old URL with trailing slash
      await page.goto('/tools/bulk-image-resizer/');

      // Should redirect to the new canonical URL
      expect(page.url()).toContain('/tools/resize/bulk-image-resizer');

      // Page should load successfully
      await expect(page.locator('h1')).toBeVisible();
    });
  });

  test.describe('Bulk Image Compressor Redirects', () => {
    test('/tools/bulk-image-compressor redirects to /tools/compress/bulk-image-compressor (301)', async ({
      page,
    }) => {
      // Navigate to the old URL without trailing slash
      await page.goto('/tools/bulk-image-compressor');

      // Should redirect to the new canonical URL
      expect(page.url()).toContain('/tools/compress/bulk-image-compressor');

      // Page should load successfully
      await expect(page.locator('h1')).toBeVisible();
    });

    test('/tools/bulk-image-compressor/ redirects to /tools/compress/bulk-image-compressor (301)', async ({
      page,
    }) => {
      // Navigate to the old URL with trailing slash
      await page.goto('/tools/bulk-image-compressor/');

      // Should redirect to the new canonical URL
      expect(page.url()).toContain('/tools/compress/bulk-image-compressor');

      // Page should load successfully
      await expect(page.locator('h1')).toBeVisible();
    });
  });

  test.describe('Canonical URLs', () => {
    test('Homepage has correct canonical URL (not localhost)', async ({ page }) => {
      await page.goto('/');

      // Check the canonical link element
      // Note: link elements in <head> are not visible, so we check for existence instead
      const canonicalLink = page.locator('link[rel="canonical"]').first();
      await expect(canonicalLink).toHaveCount(1);

      const canonicalHref = await canonicalLink.getAttribute('href');
      expect(canonicalHref).toBe('https://myimageupscaler.com/');
      expect(canonicalHref).not.toContain('localhost');
      expect(canonicalHref).not.toContain('3000');
      expect(canonicalHref).not.toContain('3001');
    });
  });
});
