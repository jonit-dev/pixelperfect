/**
 * Guides Sitemap Route - Japanese (ja)
 * Based on PRD-PSEO-I18N-001 Phase 4: Multi-language sitemap support
 *
 * Generates sitemap for Japanese guide pages with hreflang links to all language variants.
 */

import { NextResponse } from 'next/server';
import { getAllGuides } from '@/lib/seo/data-loader';
import { generateSitemapUrlEntry, getSitemapResponseHeaders } from '@/lib/seo/sitemap-generator';
import type { Locale } from '@/i18n/config';

const LOCALE: Locale = 'ja';

export async function GET() {
  const guides = await getAllGuides();

  // Generate category index entry
  const categoryEntry = generateSitemapUrlEntry({
    path: '/guides',
    locale: LOCALE,
    changeFrequency: 'weekly',
    priority: 0.7,
    includeHreflang: true,
  });

  // Generate guide page entries with hreflang
  const guideEntries = guides.map(guide =>
    generateSitemapUrlEntry({
      path: `/guides/${guide.slug}`,
      locale: LOCALE,
      lastModified: guide.lastUpdated,
      changeFrequency: 'weekly',
      priority: 0.7,
      includeHreflang: true,
    })
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${categoryEntry}
${guideEntries.join('\n')}
</urlset>`;

  return new NextResponse(xml, { headers: getSitemapResponseHeaders() });
}
