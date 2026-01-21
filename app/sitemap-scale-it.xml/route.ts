/**
 * Scale Sitemap Route - Italian (it)
 * Based on PRD-PSEO-I18N-001 Phase 4: Multi-language sitemap support
 */

import { NextResponse } from 'next/server';
import { getAllScales } from '@/lib/seo/data-loader';
import { generateSitemapUrlEntry, getSitemapResponseHeaders } from '@/lib/seo/sitemap-generator';
import type { Locale } from '@/i18n/config';

const LOCALE: Locale = 'it';

export async function GET() {
  const scales = await getAllScales();

  const categoryEntry = generateSitemapUrlEntry({
    path: '/scale',
    locale: LOCALE,
    changeFrequency: 'weekly',
    priority: 0.8,
    includeHreflang: true,
  });

  const scaleEntries = scales.map(scale =>
    generateSitemapUrlEntry({
      path: `/scale/${scale.slug}`,
      locale: LOCALE,
      lastModified: scale.lastUpdated,
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
${scaleEntries.join('\n')}
</urlset>`;

  return new NextResponse(xml, { headers: getSitemapResponseHeaders() });
}
