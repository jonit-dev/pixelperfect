/**
 * Device × Use Case Sitemap Route - Japanese (ja)
 * Based on PRD-PSEO-I18N-001 Phase 4: Multi-language sitemap support
 */

import { NextResponse } from 'next/server';
import { getAllDeviceUse } from '@/lib/seo/data-loader';
import { generateSitemapUrlEntry, getSitemapResponseHeaders } from '@/lib/seo/sitemap-generator';
import type { Locale } from '@/i18n/config';

const LOCALE: Locale = 'ja';

export async function GET() {
  const deviceUsePages = await getAllDeviceUse();

  const categoryEntry = generateSitemapUrlEntry({
    path: '/device-use',
    locale: LOCALE,
    changeFrequency: 'weekly',
    priority: 0.8,
    includeHreflang: true,
  });

  const pageEntries = deviceUsePages.map(page =>
    generateSitemapUrlEntry({
      path: `/device-use/${page.slug}`,
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
