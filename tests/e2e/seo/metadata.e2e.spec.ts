/**
 * SEO Metadata E2E Tests
 * Phase 5: Metadata & SEO with hreflang
 *
 * Tests that hreflang tags are correctly rendered in the HTML head
 */

import { test, expect } from '@playwright/test';

test.describe('SEO Metadata with hreflang', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a tool page
    await page.goto('/tools/ai-image-upscaler/');
  });

  test('should have hreflang links in head', async ({ page }) => {
    // Check for hreflang link elements in the head
    const enLink = page.locator('head link[rel="alternate"][hreflang="en"]');
    const esLink = page.locator('head link[rel="alternate"][hreflang="es"]');
    const xDefaultLink = page.locator('head link[rel="alternate"][hreflang="x-default"]');

    // Verify all hreflang links exist
    await expect(enLink, 'English hreflang link should exist').toHaveCount(1);
    await expect(esLink, 'Spanish hreflang link should exist').toHaveCount(1);
    await expect(xDefaultLink, 'x-default hreflang link should exist').toHaveCount(1);
  });

  test('should have correct hreflang URLs for English version', async ({ page }) => {
    const enLink = page.locator('head link[rel="alternate"][hreflang="en"]');
    const href = await enLink.getAttribute('href');

    expect(href).toBe('https://myimageupscaler.com/tools/ai-image-upscaler/');
  });

  test('should have correct hreflang URLs for Spanish version', async ({ page }) => {
    const esLink = page.locator('head link[rel="alternate"][hreflang="es"]');
    const href = await esLink.getAttribute('href');

    expect(href).toBe('https://myimageupscaler.com/es/tools/ai-image-upscaler/');
  });

  test('should have x-default pointing to English version', async ({ page }) => {
    const xDefaultLink = page.locator('head link[rel="alternate"][hreflang="x-default"]');
    const enLink = page.locator('head link[rel="alternate"][hreflang="en"]');

    const xDefaultHref = await xDefaultLink.getAttribute('href');
    const enHref = await enLink.getAttribute('href');

    expect(xDefaultHref).toBe(enHref);
    expect(xDefaultHref).toBe('https://myimageupscaler.com/tools/ai-image-upscaler/');
  });

  test('should have canonical link', async ({ page }) => {
    const canonicalLink = page.locator('head link[rel="canonical"]');
    const href = await canonicalLink.getAttribute('href');

    expect(href).toBe('https://myimageupscaler.com/tools/ai-image-upscaler/');
  });

  test('should have OpenGraph locale', async ({ page }) => {
    const ogLocale = page.locator('head meta[property="og:locale"]');
    const content = await ogLocale.getAttribute('content');

    expect(content).toBe('en_US');
  });
});

test.describe('SEO Metadata on Spanish pages', () => {
  test('should have hreflang links on Spanish tool page', async ({ page }) => {
    await page.goto('/es/tools/ai-image-upscaler/');

    const enLink = page.locator('head link[rel="alternate"][hreflang="en"]');
    const esLink = page.locator('head link[rel="alternate"][hreflang="es"]');
    const xDefaultLink = page.locator('head link[rel="alternate"][hreflang="x-default"]');

    await expect(enLink).toHaveCount(1);
    await expect(esLink).toHaveCount(1);
    await expect(xDefaultLink).toHaveCount(1);
  });

  test('should have Spanish OpenGraph locale on Spanish pages', async ({ page }) => {
    await page.goto('/es/tools/ai-image-upscaler/');

    const ogLocale = page.locator('head meta[property="og:locale"]');
    const content = await ogLocale.getAttribute('content');

    expect(content).toBe('es_ES');
  });

  test('should maintain canonical URL on Spanish pages', async ({ page }) => {
    await page.goto('/es/tools/ai-image-upscaler/');

    const canonicalLink = page.locator('head link[rel="canonical"]');
    const href = await canonicalLink.getAttribute('href');

    // Canonical should still point to English version
    expect(href).toBe('https://myimageupscaler.com/tools/ai-image-upscaler/');
  });
});

test.describe('SEO Metadata on category pages', () => {
  test('should have hreflang on tools category page', async ({ page }) => {
    await page.goto('/tools/');

    const enLink = page.locator('head link[rel="alternate"][hreflang="en"]');
    const esLink = page.locator('head link[rel="alternate"][hreflang="es"]');
    const xDefaultLink = page.locator('head link[rel="alternate"][hreflang="x-default"]');

    await expect(enLink).toHaveCount(1);
    await expect(esLink).toHaveCount(1);
    await expect(xDefaultLink).toHaveCount(1);
  });

  test('should have correct hreflang URLs for category pages', async ({ page }) => {
    await page.goto('/tools/');

    const esLink = page.locator('head link[rel="alternate"][hreflang="es"]');
    const href = await esLink.getAttribute('href');

    expect(href).toBe('https://myimageupscaler.com/es/tools/');
  });
});

test.describe('JSON-LD Schema with inLanguage', () => {
  test('should have inLanguage property in JSON-LD schema', async ({ page }) => {
    await page.goto('/tools/ai-image-upscaler/');

    // Find all JSON-LD script tags (there may be multiple: WebSite, Organization, SoftwareApplication)
    const schemaScripts = page.locator('script[type="application/ld+json"]');

    // Get the count and content of all schemas
    const count = await schemaScripts.count();
    expect(count).toBeGreaterThan(0);

    // Find the schema that contains SoftwareApplication
    let foundSoftwareApp = false;
    for (let i = 0; i < count; i++) {
      const content = await schemaScripts.nth(i).textContent();
      if (!content) continue;

      const schema = JSON.parse(content);

      // Check if this schema has @graph with SoftwareApplication
      if (schema['@graph']) {
        const softwareApp = schema['@graph'].find(
          (item: { '@type'?: string }) => item['@type'] === 'SoftwareApplication'
        );

        if (softwareApp) {
          foundSoftwareApp = true;
          expect(softwareApp.inLanguage).toBe('en');
          break;
        }
      }
    }

    expect(foundSoftwareApp).toBe(true);
  });

  test('should have Spanish inLanguage on Spanish pages', async ({ page }) => {
    await page.goto('/es/tools/ai-image-upscaler/');

    const schemaScripts = page.locator('script[type="application/ld+json"]');

    // Get the count and content of all schemas
    const count = await schemaScripts.count();
    expect(count).toBeGreaterThan(0);

    // Find the schema that contains SoftwareApplication
    let foundSoftwareApp = false;
    for (let i = 0; i < count; i++) {
      const content = await schemaScripts.nth(i).textContent();
      if (!content) continue;

      const schema = JSON.parse(content);

      // Check if this schema has @graph with SoftwareApplication
      if (schema['@graph']) {
        const softwareApp = schema['@graph'].find(
          (item: { '@type'?: string }) => item['@type'] === 'SoftwareApplication'
        );

        if (softwareApp) {
          foundSoftwareApp = true;
          expect(softwareApp.inLanguage).toBe('es');
          break;
        }
      }
    }

    expect(foundSoftwareApp).toBe(true);
  });
});

test.describe('Homepage hreflang', () => {
  test('should have correct hreflang for homepage', async ({ page }) => {
    await page.goto('/');

    const enLink = page.locator('head link[rel="alternate"][hreflang="en"]');
    const esLink = page.locator('head link[rel="alternate"][hreflang="es"]');
    const xDefaultLink = page.locator('head link[rel="alternate"][hreflang="x-default"]');

    const enHref = await enLink.getAttribute('href');
    const esHref = await esLink.getAttribute('href');
    const xDefaultHref = await xDefaultLink.getAttribute('href');

    expect(enHref).toBe('https://myimageupscaler.com/');
    expect(esHref).toBe('https://myimageupscaler.com/es/');
    expect(xDefaultHref).toBe('https://myimageupscaler.com/');
  });
});
