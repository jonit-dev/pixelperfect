/**
 * Formats Sitemap Route - Japanese (ja)
 * Based on PRD-PSEO-I18N-001 Phase 4: Multi-language sitemap support
 *
 * Generates sitemap for Japanese format pages with hreflang links to all language variants.
 */

import { NextResponse } from 'next/server';
import { getAllFormats } from '@/lib/seo/data-loader';
import { generateSitemapUrlEntry, getSitemapResponseHeaders } from '@/lib/seo/sitemap-generator';
import type { Locale } from '@/i18n/config';

const LOCALE: Locale = 'ja';

export async function GET() {
  const formats = await getAllFormats();

  // Generate category index entry
  const categoryEntry = generateSitemapUrlEntry({
    path: '/formats',
    locale: LOCALE,
    changeFrequency: 'weekly',
    priority: 0.8,
    includeHreflang: true,
  });

  // Generate format page entries with hreflang
  const formatEntries = formats.map(format =>
    generateSitemapUrlEntry({
      path: `/formats/${format.slug}`,
      locale: LOCALE,
      lastModified: format.lastUpdated,
      changeFrequency: 'weekly',
      priority: 0.8,
      includeHreflang: true,
    })
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${categoryEntry}
${formatEntries.join('\n')}
</urlset>`;

  return new NextResponse(xml, { headers: getSitemapResponseHeaders() });
}
