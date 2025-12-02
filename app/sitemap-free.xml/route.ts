/**
 * Free Tools Sitemap Route
 * Based on PRD-PSEO-04 Section 1.3: Category Sitemap Implementation
 */

import { NextResponse } from 'next/server';
import { getAllFreeTools } from '@/lib/seo/data-loader';
import { clientEnv } from '@shared/config/env';

const BASE_URL = clientEnv.BASE_URL;

export async function GET() {
  const freeTools = await getAllFreeTools();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${BASE_URL}/free</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
${freeTools
  .map(
    freeTool => `  <url>
    <loc>${BASE_URL}/free/${freeTool.slug}</loc>
    <lastmod>${freeTool.lastUpdated}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>${
      freeTool.ogImage
        ? `
    <image:image>
      <image:loc>${freeTool.ogImage}</image:loc>
      <image:title>${freeTool.title}</image:title>
    </image:image>`
        : ''
    }
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
