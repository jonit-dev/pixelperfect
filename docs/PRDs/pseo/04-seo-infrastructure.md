# SEO Infrastructure

## Sub-PRD 04: Technical SEO Implementation

| Field               | Value                        |
| ------------------- | ---------------------------- |
| **Parent Document** | [00-index.md](./00-index.md) |
| **Status**          | Draft                        |
| **Priority**        | P0                           |
| **Owner**           | Engineering                  |

---

## Overview

This document covers the technical SEO infrastructure for PixelPerfect's pSEO implementation, including sitemap generation, schema markup, meta tags, canonical URLs, and robots configuration.

---

## 1. Sitemap Strategy

### 1.1 Sitemap Architecture

```
/sitemap.xml                    # Sitemap index
├── /sitemap-static.xml         # Static pages
├── /sitemap-blog.xml           # Blog posts
├── /sitemap-tools.xml          # Tool pages
├── /sitemap-formats.xml        # Format pages
├── /sitemap-scale.xml          # Scale pages
├── /sitemap-use-cases.xml      # Use case pages
├── /sitemap-compare.xml        # Comparison pages
├── /sitemap-alternatives.xml   # Alternative pages
├── /sitemap-guides.xml         # Guide pages
├── /sitemap-free.xml           # Free tool pages
└── /sitemap-images.xml         # Image sitemap
```

### 1.2 Sitemap Index Implementation

```typescript
// app/sitemap.xml/route.ts
import { NextResponse } from 'next/server';

const BASE_URL = 'https://pixelperfect.app';

const sitemaps = [
  { name: 'sitemap-static.xml', lastmod: new Date().toISOString() },
  { name: 'sitemap-blog.xml', lastmod: new Date().toISOString() },
  { name: 'sitemap-tools.xml', lastmod: new Date().toISOString() },
  { name: 'sitemap-formats.xml', lastmod: new Date().toISOString() },
  { name: 'sitemap-scale.xml', lastmod: new Date().toISOString() },
  { name: 'sitemap-use-cases.xml', lastmod: new Date().toISOString() },
  { name: 'sitemap-compare.xml', lastmod: new Date().toISOString() },
  { name: 'sitemap-alternatives.xml', lastmod: new Date().toISOString() },
  { name: 'sitemap-guides.xml', lastmod: new Date().toISOString() },
  { name: 'sitemap-free.xml', lastmod: new Date().toISOString() },
  { name: 'sitemap-images.xml', lastmod: new Date().toISOString() },
];

export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map(
    sitemap => `  <sitemap>
    <loc>${BASE_URL}/${sitemap.name}</loc>
    <lastmod>${sitemap.lastmod}</lastmod>
  </sitemap>`
  )
  .join('\n')}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
```

### 1.3 Category Sitemap Implementation

```typescript
// app/sitemap-tools.xml/route.ts
import { NextResponse } from 'next/server';
import { getAllTools } from '@/lib/pseo/data-loader';

const BASE_URL = 'https://pixelperfect.app';

export async function GET() {
  const tools = await getAllTools();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${BASE_URL}/tools</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
${tools
  .map(
    tool => `  <url>
    <loc>${BASE_URL}/tools/${tool.slug}</loc>
    <lastmod>${tool.updateDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    ${
      tool.ogImage
        ? `<image:image>
      <image:loc>${tool.ogImage}</image:loc>
      <image:title>${tool.title}</image:title>
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
```

### 1.4 Image Sitemap Implementation

```typescript
// app/sitemap-images.xml/route.ts
import { NextResponse } from 'next/server';
import { getAllPSEOPages } from '@/lib/pseo/data-loader';

const BASE_URL = 'https://pixelperfect.app';

interface IImageEntry {
  pageUrl: string;
  images: Array<{
    loc: string;
    title: string;
    caption?: string;
  }>;
}

export async function GET() {
  const pages = await getAllPSEOPages();

  const imageEntries: IImageEntry[] = pages
    .filter(page => page.ogImage)
    .map(page => ({
      pageUrl: `${BASE_URL}/${page.category}/${page.slug}`,
      images: [
        {
          loc: page.ogImage!,
          title: page.title,
        },
      ],
    }));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${imageEntries
  .map(
    entry => `  <url>
    <loc>${entry.pageUrl}</loc>
${entry.images
  .map(
    img => `    <image:image>
      <image:loc>${img.loc}</image:loc>
      <image:title>${img.title}</image:title>
      ${img.caption ? `<image:caption>${img.caption}</image:caption>` : ''}
    </image:image>`
  )
  .join('\n')}
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
```

### 1.5 Priority Configuration

| Category         | Priority | Change Frequency |
| ---------------- | -------- | ---------------- |
| Homepage         | 1.0      | daily            |
| /upscaler        | 0.9      | daily            |
| /tools/\*        | 0.9      | weekly           |
| /compare/\*      | 0.85     | weekly           |
| /free/\*         | 0.85     | weekly           |
| /formats/\*      | 0.8      | weekly           |
| /scale/\*        | 0.8      | weekly           |
| /use-cases/\*    | 0.75     | weekly           |
| /alternatives/\* | 0.75     | weekly           |
| /guides/\*       | 0.7      | weekly           |
| /pricing         | 0.8      | monthly          |
| /blog/\*         | 0.6      | weekly           |

---

## 2. Schema Markup Implementation

### 2.1 Schema Generator Module

```typescript
// src/lib/pseo/schema-generator.ts
import type {
  IToolPage,
  IComparisonPage,
  IGuidePage,
  IUseCasePage,
  IAlternativePage,
} from '@/types/pseo';

const ORGANIZATION_SCHEMA = {
  '@type': 'Organization',
  name: 'PixelPerfect',
  url: 'https://pixelperfect.app',
  logo: {
    '@type': 'ImageObject',
    url: 'https://pixelperfect.app/logo.png',
    width: 512,
    height: 512,
  },
  sameAs: ['https://twitter.com/pixelperfect', 'https://linkedin.com/company/pixelperfect'],
};

// Tool Page Schema - SoftwareApplication + FAQPage
export function generateToolSchema(tool: IToolPage) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: tool.title,
        description: tool.metaDescription,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web Browser',
        url: tool.canonicalUrl,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          description: 'Free tier with 10 credits',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          ratingCount: '1250',
          bestRating: '5',
          worstRating: '1',
        },
        author: ORGANIZATION_SCHEMA,
        publisher: ORGANIZATION_SCHEMA,
      },
      {
        '@type': 'FAQPage',
        mainEntity: tool.faq.map(item => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://pixelperfect.app',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Tools',
            item: 'https://pixelperfect.app/tools',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: tool.title,
            item: tool.canonicalUrl,
          },
        ],
      },
    ],
  };
}

// Comparison Page Schema - Article + FAQPage
export function generateComparisonSchema(comparison: IComparisonPage) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${comparison.canonicalUrl}#article`,
        headline: comparison.h1,
        description: comparison.metaDescription,
        image: comparison.ogImage || 'https://pixelperfect.app/og/compare-default.png',
        datePublished: comparison.publishDate,
        dateModified: comparison.updateDate,
        author: ORGANIZATION_SCHEMA,
        publisher: ORGANIZATION_SCHEMA,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': comparison.canonicalUrl,
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: comparison.faq.map(item => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://pixelperfect.app',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Comparisons',
            item: 'https://pixelperfect.app/compare',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: comparison.title,
            item: comparison.canonicalUrl,
          },
        ],
      },
    ],
  };
}

// Guide Page Schema - HowTo + FAQPage + Article
export function generateGuideSchema(guide: IGuidePage) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'HowTo',
        '@id': `${guide.canonicalUrl}#howto`,
        name: guide.h1,
        description: guide.metaDescription,
        totalTime: `PT${guide.readTime}M`,
        step: guide.howToSteps.map((step, index) => ({
          '@type': 'HowToStep',
          position: index + 1,
          name: step.name,
          text: step.text,
          image: step.image,
          url: step.url || `${guide.canonicalUrl}#step-${index + 1}`,
        })),
        author: ORGANIZATION_SCHEMA,
        publisher: ORGANIZATION_SCHEMA,
      },
      {
        '@type': 'Article',
        '@id': `${guide.canonicalUrl}#article`,
        headline: guide.h1,
        description: guide.metaDescription,
        image: guide.ogImage || 'https://pixelperfect.app/og/guide-default.png',
        datePublished: guide.publishDate,
        dateModified: guide.updateDate,
        author: ORGANIZATION_SCHEMA,
        publisher: ORGANIZATION_SCHEMA,
        articleSection: 'Guides',
        wordCount:
          guide.introduction.split(' ').length +
          guide.sections.reduce((acc, s) => acc + s.content.split(' ').length, 0),
      },
      {
        '@type': 'FAQPage',
        mainEntity: guide.faq.map(item => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://pixelperfect.app',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Guides',
            item: 'https://pixelperfect.app/guides',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: guide.title,
            item: guide.canonicalUrl,
          },
        ],
      },
    ],
  };
}

// Use Case Page Schema - Article + Industry-specific
export function generateUseCaseSchema(useCase: IUseCasePage) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${useCase.canonicalUrl}#article`,
        headline: useCase.h1,
        description: useCase.metaDescription,
        image: useCase.ogImage || 'https://pixelperfect.app/og/usecase-default.png',
        datePublished: useCase.publishDate,
        dateModified: useCase.updateDate,
        author: ORGANIZATION_SCHEMA,
        publisher: ORGANIZATION_SCHEMA,
        about: {
          '@type': 'Thing',
          name: useCase.industry,
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: useCase.faq.map(item => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://pixelperfect.app',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Use Cases',
            item: 'https://pixelperfect.app/use-cases',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: useCase.title,
            item: useCase.canonicalUrl,
          },
        ],
      },
    ],
  };
}

// Alternative Page Schema - ItemList + Article
export function generateAlternativeSchema(alternative: IAlternativePage) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ItemList',
        '@id': `${alternative.canonicalUrl}#list`,
        name: `Best ${alternative.targetProduct} Alternatives`,
        description: alternative.metaDescription,
        numberOfItems: alternative.alternatives.length,
        itemListElement: alternative.alternatives.map(alt => ({
          '@type': 'ListItem',
          position: alt.rank,
          item: {
            '@type': 'SoftwareApplication',
            name: alt.name,
            description: alt.description,
            applicationCategory: 'MultimediaApplication',
            ...(alt.url && { url: alt.url }),
          },
        })),
      },
      {
        '@type': 'Article',
        '@id': `${alternative.canonicalUrl}#article`,
        headline: alternative.h1,
        description: alternative.metaDescription,
        datePublished: alternative.publishDate,
        dateModified: alternative.updateDate,
        author: ORGANIZATION_SCHEMA,
        publisher: ORGANIZATION_SCHEMA,
      },
      {
        '@type': 'FAQPage',
        mainEntity: alternative.faq.map(item => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://pixelperfect.app',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Alternatives',
            item: 'https://pixelperfect.app/alternatives',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: alternative.title,
            item: alternative.canonicalUrl,
          },
        ],
      },
    ],
  };
}
```

### 2.2 Schema Component

```typescript
// src/components/pseo/SchemaMarkup.tsx
import Script from 'next/script';

interface ISchemaMarkupProps {
  schema: object;
}

export default function SchemaMarkup({ schema }: ISchemaMarkupProps) {
  return (
    <Script
      id="schema-markup"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      strategy="afterInteractive"
    />
  );
}
```

---

## 3. Meta Tag Implementation

### 3.1 Meta Tag Patterns

```typescript
// src/lib/pseo/meta-generator.ts

export const META_PATTERNS: Record<string, IMetaPattern> = {
  tools: {
    title: '{ToolName} - {Benefit} Free | PixelPerfect',
    description:
      '{Action} with AI. Free online {ToolType} that {UniqueValue}. No watermarks, fast processing. Try PixelPerfect now.',
    titleMaxLength: 60,
    descriptionMaxLength: 160,
  },
  formats: {
    title: 'Upscale {Format} Images to {Resolution} | PixelPerfect',
    description:
      'Upscale {Format} images with AI. Free online {Format} upscaler that preserves quality. Convert low-res {Format} to HD instantly.',
    titleMaxLength: 60,
    descriptionMaxLength: 160,
  },
  compare: {
    title: 'PixelPerfect vs {Competitor}: Which {ToolType} is Best?',
    description:
      'Compare PixelPerfect and {Competitor} for {UseCase}. See features, pricing, pros & cons. Find the best {ToolType} for your needs.',
    titleMaxLength: 60,
    descriptionMaxLength: 160,
  },
  alternatives: {
    title: 'Best {Competitor} Alternatives in 2025 | PixelPerfect',
    description:
      'Looking for {Competitor} alternatives? Compare top {ToolType} tools including PixelPerfect. Free options, pricing, and features compared.',
    titleMaxLength: 60,
    descriptionMaxLength: 160,
  },
  'use-cases': {
    title: '{Industry} Image Enhancement - {UseCase} | PixelPerfect',
    description:
      'Enhance {Industry} images with AI. Perfect for {UseCase}. Upscale product photos, listings, and more. Free to start.',
    titleMaxLength: 60,
    descriptionMaxLength: 160,
  },
  guides: {
    title: 'How to {Action} - Step-by-Step Guide | PixelPerfect',
    description:
      'Learn how to {Action} with this comprehensive guide. {Benefit}. Free tips and tools included.',
    titleMaxLength: 60,
    descriptionMaxLength: 160,
  },
  free: {
    title: 'Free {ToolName} - No Registration Required | PixelPerfect',
    description:
      'Use our free {ToolName} online. No watermarks, no sign-up required. {Benefit}. Try it now!',
    titleMaxLength: 60,
    descriptionMaxLength: 160,
  },
  scale: {
    title: 'Upscale Images to {Scale} - Free {Resolution} Upscaler | PixelPerfect',
    description:
      'Upscale images to {Scale} resolution with AI. Free online tool for {Resolution} enhancement. Perfect for {UseCase}.',
    titleMaxLength: 60,
    descriptionMaxLength: 160,
  },
};

interface IMetaPattern {
  title: string;
  description: string;
  titleMaxLength: number;
  descriptionMaxLength: number;
}

export function validateMeta(title: string, description: string): IMetaValidation {
  const issues: string[] = [];

  if (title.length < 30) {
    issues.push('Title too short (min 30 chars)');
  }
  if (title.length > 60) {
    issues.push(`Title too long: ${title.length}/60 chars`);
  }
  if (description.length < 120) {
    issues.push('Description too short (min 120 chars)');
  }
  if (description.length > 160) {
    issues.push(`Description too long: ${description.length}/160 chars`);
  }

  return {
    valid: issues.length === 0,
    issues,
    titleLength: title.length,
    descriptionLength: description.length,
  };
}

interface IMetaValidation {
  valid: boolean;
  issues: string[];
  titleLength: number;
  descriptionLength: number;
}
```

### 3.2 Metadata Generation

```typescript
// src/lib/pseo/metadata-factory.ts
import { Metadata } from 'next';
import type { IPSEOPage } from '@/types/pseo';

const BASE_URL = 'https://pixelperfect.app';

export function generateMetadata(page: IPSEOPage, category: string): Metadata {
  const canonicalUrl = `${BASE_URL}/${category}/${page.slug}`;

  return {
    title: page.metaTitle,
    description: page.metaDescription,

    // Open Graph
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      type: 'website',
      url: canonicalUrl,
      siteName: 'PixelPerfect',
      locale: 'en_US',
      images: [
        {
          url: page.ogImage || `${BASE_URL}/og/${category}-default.png`,
          width: 1200,
          height: 630,
          alt: page.title,
        },
      ],
    },

    // Twitter
    twitter: {
      card: 'summary_large_image',
      title: page.metaTitle,
      description: page.metaDescription,
      images: [page.ogImage || `${BASE_URL}/og/${category}-default.png`],
      creator: '@pixelperfect',
    },

    // Canonical & Alternates
    alternates: {
      canonical: canonicalUrl,
    },

    // Robots
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },

    // Additional
    authors: [{ name: 'PixelPerfect', url: BASE_URL }],
    generator: 'Next.js',
    applicationName: 'PixelPerfect',
    referrer: 'origin-when-cross-origin',
    keywords: page.secondaryKeywords?.join(', '),
    category: category,
    classification: 'Image Enhancement Tools',
  };
}
```

---

## 4. Canonical URL Strategy

### 4.1 Canonical Rules

```typescript
// src/lib/pseo/canonical-utils.ts

const BASE_URL = 'https://pixelperfect.app';

// Primary page is always canonical
export function getCanonicalUrl(category: string, slug: string): string {
  return `${BASE_URL}/${category}/${slug}`;
}

// Keyword-to-canonical mapping to prevent cannibalization
export const KEYWORD_CANONICAL_MAP: Record<string, string> = {
  // Primary keywords point to main tool pages
  'image upscaler': '/tools/ai-image-upscaler',
  'ai image upscaler': '/tools/ai-image-upscaler',
  'ai upscaler': '/tools/ai-image-upscaler',
  'photo upscaler': '/tools/ai-image-upscaler',

  'photo enhancer': '/tools/ai-photo-enhancer',
  'ai photo enhancer': '/tools/ai-photo-enhancer',
  'image enhancer': '/tools/ai-photo-enhancer',

  // Free keywords point to free pages
  'free image upscaler': '/free/free-image-upscaler',
  'free ai upscaler': '/free/free-ai-upscaler',
  'free photo enhancer': '/free/free-photo-enhancer',

  // Format keywords point to format pages
  'jpeg upscaler': '/formats/upscale-jpeg-images',
  'png upscaler': '/formats/upscale-png-images',
  'webp upscaler': '/formats/upscale-webp-images',

  // Scale keywords point to scale pages
  '4k upscaler': '/scale/upscale-to-4k',
  '8k upscaler': '/scale/upscale-to-8k',
  '2x upscale': '/scale/upscale-images-2x',
  '4x upscale': '/scale/upscale-images-4x',
};

// Prevent duplicate pages
export const REDIRECT_RULES: Record<string, string> = {
  // Ensure no overlap between tools and free
  '/tools/free-image-upscaler': '/free/free-image-upscaler',
  '/tools/free-ai-upscaler': '/free/free-ai-upscaler',

  // Legacy URL redirects
  '/upscale': '/tools/ai-image-upscaler',
  '/enhance': '/tools/ai-photo-enhancer',
  '/restore': '/tools/photo-restoration',
};
```

### 4.2 URL Parameter Handling

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'index, follow, max-image-preview:large',
          },
        ],
      },
    ];
  },
};

// Middleware to strip unwanted parameters
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const STRIP_PARAMS = ['ref', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

export function middleware(request: NextRequest) {
  const url = new URL(request.url);
  let hasStrippedParams = false;

  // Strip tracking parameters for canonical purposes
  STRIP_PARAMS.forEach(param => {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      hasStrippedParams = true;
    }
  });

  // Only redirect if parameters were stripped
  if (hasStrippedParams) {
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## 5. Robots.txt Configuration

### 5.1 Robots.txt Implementation

```typescript
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://pixelperfect.app';

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
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
```

---

## 6. Core Web Vitals Optimization

### 6.1 Performance Targets

| Metric                         | Target  | Maximum |
| ------------------------------ | ------- | ------- |
| LCP (Largest Contentful Paint) | < 2.0s  | < 2.5s  |
| FID (First Input Delay)        | < 50ms  | < 100ms |
| CLS (Cumulative Layout Shift)  | < 0.05  | < 0.1   |
| TTFB (Time to First Byte)      | < 200ms | < 400ms |
| FCP (First Contentful Paint)   | < 1.5s  | < 2.0s  |
| TTI (Time to Interactive)      | < 3.5s  | < 4.0s  |

### 6.2 Optimization Strategies

```typescript
// next.config.ts
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  experimental: {
    optimizeCss: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};
```

### 6.3 Image Optimization Guidelines

```yaml
# Hero Images
Format: WebP with AVIF preference
Max Width: 1920px
Quality: 80%
Loading: eager (above fold only)
Priority: true for LCP images

# Content Images
Format: WebP
Max Width: 800px
Quality: 75%
Loading: lazy
Sizes: (max-width: 768px) 100vw, 800px

# Thumbnails
Format: WebP
Max Width: 400px
Quality: 70%
Loading: lazy
```

---

## 7. Monitoring & Alerts

### 7.1 SEO Monitoring Configuration

```typescript
// src/lib/monitoring/seo-alerts.ts

interface ISEOAlertConfig {
  metric: string;
  threshold: number | string;
  period?: string;
  channel: 'slack' | 'email' | 'pagerduty';
}

export const SEO_ALERT_CONFIG: ISEOAlertConfig[] = [
  // Search Console Alerts
  {
    metric: 'indexing_errors',
    threshold: 5,
    channel: 'slack',
  },
  {
    metric: 'coverage_drops',
    threshold: 10, // percentage
    period: '7d',
    channel: 'email',
  },
  {
    metric: 'core_web_vitals',
    threshold: 'poor',
    channel: 'slack',
  },

  // Traffic Alerts
  {
    metric: 'organic_traffic_drop',
    threshold: 20, // percentage
    period: '7d',
    channel: 'email',
  },
  {
    metric: 'bounce_rate_spike',
    threshold: 80, // percentage
    channel: 'slack',
  },
  {
    metric: 'conversion_drop',
    threshold: 30, // percentage
    period: '7d',
    channel: 'email',
  },

  // Technical Monitoring
  {
    metric: 'lighthouse_score',
    threshold: 85,
    channel: 'slack',
  },
  {
    metric: 'sitemap_errors',
    threshold: 1,
    channel: 'slack',
  },
];
```

### 7.2 Health Check Endpoint

```typescript
// app/api/health/seo/route.ts
import { NextResponse } from 'next/server';
import { getAllPSEOPages } from '@/lib/pseo/data-loader';

export async function GET() {
  const pages = await getAllPSEOPages();

  const checks = {
    totalPages: pages.length,
    pagesWithMeta: pages.filter(p => p.metaTitle && p.metaDescription).length,
    pagesWithCanonical: pages.filter(p => p.canonicalUrl).length,
    pagesUpdatedRecently: pages.filter(p => {
      const updated = new Date(p.updateDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return updated > thirtyDaysAgo;
    }).length,
  };

  const healthy =
    checks.pagesWithMeta === checks.totalPages && checks.pagesWithCanonical === checks.totalPages;

  return NextResponse.json({
    status: healthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  });
}
```

---

## 8. Implementation Checklist

### Phase 1: Foundation

- [ ] Implement sitemap index
- [ ] Create category sitemaps
- [ ] Implement image sitemap
- [ ] Configure robots.txt
- [ ] Set up canonical URL generation

### Phase 2: Schema Markup

- [ ] Implement tool page schema
- [ ] Implement comparison page schema
- [ ] Implement guide page schema
- [ ] Implement alternative page schema
- [ ] Test with Google Rich Results

### Phase 3: Optimization

- [ ] Configure meta tag patterns
- [ ] Implement metadata factory
- [ ] Set up Core Web Vitals monitoring
- [ ] Configure image optimization
- [ ] Implement SEO health checks

### Phase 4: Monitoring

- [ ] Set up Search Console integration
- [ ] Configure alerting rules
- [ ] Create SEO dashboard
- [ ] Implement automated audits

---

## Document Changelog

| Version | Date       | Author           | Changes                    |
| ------- | ---------- | ---------------- | -------------------------- |
| 1.0     | 2025-12-01 | Development Team | Initial SEO infrastructure |
