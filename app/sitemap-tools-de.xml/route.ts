/**
 * Tools Sitemap Route - German (de)
 * Based on PRD-PSEO-I18N-001 Phase 4: Multi-language sitemap support
 *
 * Generates sitemap for German tools pages with hreflang links to all language variants.
 */

import { NextResponse } from 'next/server';
import { getAllTools } from '@/lib/seo/data-loader';
import { generateSitemapUrlEntry, getSitemapResponseHeaders } from '@/lib/seo/sitemap-generator';
import type { Locale } from '@/i18n/config';

const LOCALE: Locale = 'de';

export async function GET() {
  const tools = await getAllTools();

  // Generate category index entry
  const categoryEntry = generateSitemapUrlEntry({
    path: '/tools',
    locale: LOCALE,
    changeFrequency: 'weekly',
    priority: 0.8,
    includeHreflang: true,
  });

  // Generate tool page entries with hreflang
  const toolEntries = tools.map(tool =>
    generateSitemapUrlEntry({
      path: `/tools/${tool.slug}`,
      locale: LOCALE,
      lastModified: tool.lastUpdated,
      changeFrequency: 'weekly',
      priority: 0.9,
      includeHreflang: true,
    })
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${categoryEntry}
${toolEntries.join('\n')}
</urlset>`;

  return new NextResponse(xml, { headers: getSitemapResponseHeaders() });
}
