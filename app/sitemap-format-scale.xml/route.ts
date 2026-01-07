/**
 * Format × Scale Sitemap Route
 * Based on PRD-PSEO-04 Section 1.3: Category Sitemap Implementation
 */

import { NextResponse } from 'next/server';
import { getAllFormatScale } from '@/lib/seo/data-loader';
import { clientEnv } from '@shared/config/env';

const BASE_URL = `https://${clientEnv.PRIMARY_DOMAIN}`;

export async function GET() {
  const formatScalePages = await getAllFormatScale();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${BASE_URL}/format-scale</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
${formatScalePages
  .map(
    page => `  <url>
    <loc>${BASE_URL}/format-scale/${page.slug}</loc>
    <lastmod>${page.lastUpdated}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${
      page.ogImage
        ? `
    <image:image>
      <image:loc>${page.ogImage}</image:loc>
      <image:title>${page.title}</image:title>
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
