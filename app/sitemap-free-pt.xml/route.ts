/**
 * Free Sitemap Route - Portuguese (pt)
 * Based on PRD-PSEO-I18N-001 Phase 4: Multi-language sitemap support
 *
 * Generates sitemap for Portuguese free tool pages with hreflang links to all language variants.
 */

import { NextResponse } from 'next/server';
import { getAllFreeTools } from '@/lib/seo/data-loader';
import { generateSitemapUrlEntry, getSitemapResponseHeaders } from '@/lib/seo/sitemap-generator';
import type { Locale } from '@/i18n/config';

const LOCALE: Locale = 'pt';

export async function GET() {
  const freeTools = await getAllFreeTools();

  // Generate category index entry
  const categoryEntry = generateSitemapUrlEntry({
    path: '/free',
    locale: LOCALE,
    changeFrequency: 'weekly',
    priority: 0.8,
    includeHreflang: true,
  });

  // Generate free tool page entries with hreflang
  const freeEntries = freeTools.map(tool =>
    generateSitemapUrlEntry({
      path: `/free/${tool.slug}`,
      locale: LOCALE,
      lastModified: tool.lastUpdated,
      changeFrequency: 'weekly',
      priority: 0.8,
      includeHreflang: true,
    })
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${categoryEntry}
${freeEntries.join('\n')}
</urlset>`;

  return new NextResponse(xml, { headers: getSitemapResponseHeaders() });
}
