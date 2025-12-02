/**
 * Robots.txt Configuration
 * Based on PRD-PSEO-04 Section 5.1: Robots.txt Implementation
 */

import { MetadataRoute } from 'next';
import { clientEnv } from '@shared/config/env';

const BASE_URL = clientEnv.BASE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/_next/',
          '/private/',
          '/*.json$',
          '/success',
          '/canceled',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: '/',
      },
      {
        userAgent: 'Google-Extended',
        disallow: '/',
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
