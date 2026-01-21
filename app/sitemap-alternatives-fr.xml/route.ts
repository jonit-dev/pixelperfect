/**
 * Alternatives Sitemap Route - French (fr)
 * Based on PRD-PSEO-I18N-001 Phase 4: Multi-language sitemap support
 */

import { NextResponse } from 'next/server';
import { getAllAlternatives } from '@/lib/seo/data-loader';
import { generateSitemapUrlEntry, getSitemapResponseHeaders } from '@/lib/seo/sitemap-generator';
import type { Locale } from '@/i18n/config';

const LOCALE: Locale = 'fr';

export async function GET() {
  const alternatives = await getAllAlternatives();

  const categoryEntry = generateSitemapUrlEntry({
    path: '/alternatives',
    locale: LOCALE,
    changeFrequency: 'weekly',
    priority: 0.75,
    includeHreflang: true,
  });

  const alternativeEntries = alternatives.map(alternative =>
    generateSitemapUrlEntry({
      path: `/alternatives/${alternative.slug}`,
      locale: LOCALE,
      lastModified: alternative.lastUpdated,
      changeFrequency: 'weekly',
      priority: 0.75,
      includeHreflang: true,
    })
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${categoryEntry}
${alternativeEntries.join('\n')}
</urlset>`;

  return new NextResponse(xml, { headers: getSitemapResponseHeaders() });
}
