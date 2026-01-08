/**
 * Sitemap Index Route
 * Based on PRD-PSEO-04 Section 1.2: Sitemap Index Implementation
 * Phase 4: Multi-language sitemap support for 7 languages (en, es, pt, de, fr, it, ja)
 *
 * Generates a sitemap index that points to all locale-specific sitemaps.
 * Each category has sitemaps for locales with translated content.
 */

import { NextResponse } from 'next/server';
import { clientEnv } from '@shared/config/env';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/i18n/config';
// generateSitemapIndexEntries available in '@/lib/seo/sitemap-generator' if needed

const BASE_URL = `https://${clientEnv.PRIMARY_DOMAIN}`;

// Categories that should have sitemaps
// Note: Compare and alternatives are English-only (no localized content)
const CATEGORIES = [
  'static',
  'blog',
  'tools',
  'formats',
  'scale',
  'use-cases',
  'compare',
  'alternatives',
  'guides',
  'free',
  'platforms',
  'images',
  'format-scale',
  'platform-format',
  'device-use',
  'ai-features',
];

/**
 * Categories that have localized content for all 7 languages
 */
const LOCALIZED_CATEGORIES = ['tools', 'formats', 'free', 'guides'];

/**
 * Generate sitemap index with locale-specific sitemaps
 * - Localized categories: 7 sitemaps (one per locale)
 * - English-only categories: 1 sitemap (English only)
 */
export async function GET() {
  const sitemapEntries: Array<{ name: string; lastmod: string }> = [];

  // Generate sitemap entries for each category
  for (const category of CATEGORIES) {
    const isLocalized = LOCALIZED_CATEGORIES.includes(category);

    if (isLocalized) {
      // Generate sitemaps for all supported locales
      for (const locale of SUPPORTED_LOCALES) {
        const filename = locale === DEFAULT_LOCALE
          ? `sitemap-${category}.xml`
          : `sitemap-${category}-${locale}.xml`;
        sitemapEntries.push({
          name: filename,
          lastmod: new Date().toISOString(),
        });
      }
    } else {
      // English-only categories get single sitemap
      sitemapEntries.push({
        name: `sitemap-${category}.xml`,
        lastmod: new Date().toISOString(),
      });
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries
  .map(
    sitemap => `  <sitemap>
    <loc>${BASE_URL}/${sitemap.name}</loc>
    <lastmod>${sitemap.lastmod}</lastmod>
  </sitemap>`
  )
  .join('\n')}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
