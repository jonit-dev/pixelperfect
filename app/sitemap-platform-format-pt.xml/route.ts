/**
 * Platform × Format Sitemap Route - Portuguese (pt)
 * Based on PRD-PSEO-I18N-001 Phase 4: Multi-language sitemap support
 */

import { NextResponse } from 'next/server';
import { getAllPlatformFormat } from '@/lib/seo/data-loader';
import { generateSitemapUrlEntry, getSitemapResponseHeaders } from '@/lib/seo/sitemap-generator';
import type { Locale } from '@/i18n/config';

const LOCALE: Locale = 'pt';

export async function GET() {
  const platformFormatPages = await getAllPlatformFormat();

  const categoryEntry = generateSitemapUrlEntry({
    path: '/platform-format',
    locale: LOCALE,
    changeFrequency: 'weekly',
    priority: 0.8,
    includeHreflang: true,
  });

  const pageEntries = platformFormatPages.map(page =>
    generateSitemapUrlEntry({
      path: `/platform-format/${page.slug}`,
      locale: LOCALE,
      lastModified: page.lastUpdated,
      changeFrequency: 'weekly',
      priority: 0.8,
      includeHreflang: true,
    })
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${categoryEntry}
${pageEntries.join('\n')}
</urlset>`;

  return new NextResponse(xml, { headers: getSitemapResponseHeaders() });
}
