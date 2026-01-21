#!/usr/bin/env tsx

/**
 * Sitemap URL Validator
 *
 * Crawls sitemap URLs and checks for:
 * - HTTP 404 status codes
 * - Pages with 404-related content (not found messages, error pages)
 * - Soft 404s (pages showing "not supported" content)
 * - Other HTTP errors (500, 503, etc.)
 *
 * Usage:
 *   npx tsx scripts/validate-sitemap-urls.ts                        # Validate ALL URLs
 *   npx tsx scripts/validate-sitemap-urls.ts --patterns-only        # Validate one sample per route pattern (fast)
 *   npx tsx scripts/validate-sitemap-urls.ts --one-per-category     # Validate one page per pSEO category
 *   npx tsx scripts/validate-sitemap-urls.ts --base-url=https://example.com
 *   npx tsx scripts/validate-sitemap-urls.ts --port=3003            # Custom port for localhost
 *   npx tsx scripts/validate-sitemap-urls.ts --delay=1000           # Custom delay between requests (ms)
 */

import { parseStringPromise } from 'xml2js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Types for xml2js parsed results
interface IXml2JsSitemapIndex {
  sitemapindex?: {
    sitemap: Array<{ loc: string[] }>;
  };
}

interface IXml2JsUrlEntry {
  loc: string[];
  lastmod?: string[];
  changefreq?: string[];
  priority?: string[];
}

interface IXml2JsUrlset {
  urlset?: {
    url: IXml2JsUrlEntry[];
  };
}

interface ISitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

interface IValidationResult {
  url: string;
  status: number;
  issue?: string;
  responseTime?: number;
  contentType?: string;
  pattern?: string;
  category?: string;
}

interface IPatternGroup {
  pattern: string;
  urls: string[];
  sampleUrl: string;
}

interface ICategoryGroup {
  category: string;
  urls: string[];
  sampleUrl: string;
}

interface ISitemapValidationReport {
  totalUrls: number;
  testedUrls: number;
  successfulUrls: number;
  failedUrls: number;
  errors: IValidationResult[];
  warnings: IValidationResult[];
  patterns?: IPatternGroup[];
  categories?: ICategoryGroup[];
  timestamp: string;
  mode: 'full' | 'patterns-only' | 'one-per-category';
}

class SitemapValidator {
  private baseUrl: string;
  private results: IValidationResult[] = [];
  private requestDelay = 500; // ms between requests to avoid overwhelming the server
  private timeout = 10000; // 10 second timeout per request
  private mode: 'full' | 'patterns-only' | 'one-per-category';

  // pSEO categories for PixelPerfect
  private readonly PSEO_CATEGORIES = [
    'tools',
    'formats',
    'scale',
    'use-cases',
    'compare',
    'alternatives',
    'guides',
    'free',
    'bulk-tools',
    'platforms',
    'content',
    'ai-features',
    'device-use',
    'format-scale',
    'platform-format',
  ];

  constructor(
    baseUrl: string,
    mode: 'full' | 'patterns-only' | 'one-per-category' = 'full',
    delay?: number
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.mode = mode;
    if (delay) {
      this.requestDelay = delay;
    }
  }

  /**
   * Extract route pattern from URL
   * e.g., /formats/jpeg-upscaler -> /formats/[slug]
   *      /format-scale/jpeg-upscale-2x -> /format-scale/[format]-[scale]
   */
  private extractPattern(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Known dynamic segments based on Next.js routes
      // Order matters - more specific patterns first
      const dynamicPatterns: { regex: RegExp; replacement: string }[] = [
        // /format-scale/[format]-[scale] - format × scale multiplier
        {
          regex: /^\/format-scale\/([a-z0-9-]+)-upscale-([0-9.]+x)$/i,
          replacement: '/format-scale/[format]-upscale-[scale]',
        },
        // /platform-format/[platform]-[format] - platform × format multiplier
        {
          regex: /^\/platform-format\/([a-z0-9-]+)-([a-z0-9-]+)$/i,
          replacement: '/platform-format/[platform]-[format]',
        },
        // /device-use/[device]-[usecase] - device × use case multiplier
        {
          regex: /^\/device-use\/(mobile|desktop|tablet)-([a-z0-9-]+)$/i,
          replacement: '/device-use/[device]-[usecase]',
        },
        // /[category]/[slug] - standard pSEO pages
        {
          regex: /^\/([a-z-]+)\/([a-z0-9-]+)$/i,
          replacement: (match: string, category: string) => {
            // If category is a known pSEO category, return pattern
            if (this.PSEO_CATEGORIES.includes(category)) {
              return `/${category}/[slug]`;
            }
            // Otherwise return as-is (static route)
            return match;
          },
        },
        // /blog/[slug]
        { regex: /^\/blog\/([a-z0-9-]+)$/i, replacement: '/blog/[slug]' },
        // /legal/[page]
        { regex: /^\/legal\/([a-z0-9-]+)$/i, replacement: '/legal/[page]' },
        // Locale-prefixed patterns
        {
          regex: /^\/[a-z]{2}\/format-scale\/([a-z0-9-]+)-upscale-([0-9.]+x)$/i,
          replacement: '/[locale]/format-scale/[format]-upscale-[scale]',
        },
        {
          regex: /^\/[a-z]{2}\/platform-format\/([a-z0-9-]+)-([a-z0-9-]+)$/i,
          replacement: '/[locale]/platform-format/[platform]-[format]',
        },
        {
          regex: /^\/[a-z]{2}\/([a-z-]+)\/([a-z0-9-]+)$/i,
          replacement: (match: string, locale: string, category: string) => {
            if (this.PSEO_CATEGORIES.includes(category)) {
              return `/[locale]/${category}/[slug]`;
            }
            return match;
          },
        },
      ];

      for (const { regex, replacement } of dynamicPatterns) {
        if (regex.test(pathname)) {
          if (typeof replacement === 'function') {
            return replacement(pathname);
          }
          return replacement;
        }
      }

      // Return pathname as-is for static routes
      return pathname;
    } catch {
      return url;
    }
  }

  /**
   * Extract category from URL
   */
  private extractCategoryFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Check for locale prefix
      const localeMatch = pathname.match(/^\/([a-z]{2})\/(.+)$/i);
      const pathWithoutLocale = localeMatch ? localeMatch[2] : pathname;

      // Match /category/slug
      const categoryMatch = pathWithoutLocale.match(/^\/([a-z-]+)\/[a-z0-9-]+$/i);
      if (categoryMatch) {
        const category = categoryMatch[1];
        if (this.PSEO_CATEGORIES.includes(category)) {
          return category;
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Group URLs by their route pattern
   */
  private groupUrlsByPattern(urls: ISitemapUrl[]): IPatternGroup[] {
    const patternMap = new Map<string, string[]>();

    for (const url of urls) {
      const pattern = this.extractPattern(url.loc);
      const existing = patternMap.get(pattern) || [];
      existing.push(url.loc);
      patternMap.set(pattern, existing);
    }

    const groups: IPatternGroup[] = [];
    for (const [pattern, urlList] of patternMap) {
      groups.push({
        pattern,
        urls: urlList,
        sampleUrl: urlList[0], // Pick first URL as sample
      });
    }

    // Sort by pattern name for consistent output
    groups.sort((a, b) => a.pattern.localeCompare(b.pattern));

    return groups;
  }

  /**
   * Group URLs by category
   */
  private groupUrlsByCategory(urls: ISitemapUrl[]): ICategoryGroup[] {
    const categoryMap = new Map<string, string[]>();
    const otherUrls: string[] = [];

    for (const url of urls) {
      const category = this.extractCategoryFromUrl(url.loc);
      if (category) {
        const existing = categoryMap.get(category) || [];
        existing.push(url.loc);
        categoryMap.set(category, existing);
      } else {
        otherUrls.push(url.loc);
      }
    }

    const groups: ICategoryGroup[] = [];
    for (const [category, urlList] of categoryMap) {
      groups.push({
        category,
        urls: urlList,
        sampleUrl: urlList[0],
      });
    }

    // Add "other" group for non-category URLs
    if (otherUrls.length > 0) {
      groups.push({
        category: 'other',
        urls: otherUrls,
        sampleUrl: otherUrls[0],
      });
    }

    // Sort by category name for consistent output
    groups.sort((a, b) => a.category.localeCompare(b.category));

    return groups;
  }

  /**
   * Fetch and parse XML sitemap (validates response is XML, not HTML)
   */
  private async fetchSitemap(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SitemapValidator/1.0 (PixelPerfect QA Tool)',
      },
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();

    // Validate response is XML, not HTML error page
    const trimmed = text.trim();
    if (
      !trimmed.startsWith('<?xml') &&
      !trimmed.startsWith('<urlset') &&
      !trimmed.startsWith('<sitemapindex')
    ) {
      throw new Error(
        `Invalid sitemap response: expected XML, got HTML (possibly a 500 error page)`
      );
    }

    return text;
  }

  /**
   * Parse sitemap index to get nested sitemap URLs
   */
  private async parseSitemapIndex(xml: string): Promise<string[]> {
    const parsed = (await parseStringPromise(xml)) as IXml2JsSitemapIndex;

    if (parsed.sitemapindex?.sitemap) {
      return parsed.sitemapindex.sitemap.map(s => s.loc[0]);
    }

    return [];
  }

  /**
   * Parse sitemap to get page URLs (rewritten to use baseUrl)
   */
  private async parseSitemapUrls(xml: string): Promise<ISitemapUrl[]> {
    const parsed = (await parseStringPromise(xml)) as IXml2JsUrlset;

    if (!parsed.urlset?.url) {
      return [];
    }

    return parsed.urlset.url.map(u => {
      const originalLoc = u.loc[0];
      let rewrittenLoc = originalLoc;

      // Rewrite production URLs to localhost
      try {
        const urlObj = new URL(originalLoc);
        rewrittenLoc = `${this.baseUrl}${urlObj.pathname}`;
      } catch {
        // Keep original if URL parsing fails
      }

      return {
        loc: rewrittenLoc,
        lastmod: u.lastmod?.[0],
        changefreq: u.changefreq?.[0],
        priority: u.priority?.[0],
      };
    });
  }

  /**
   * Check if page content contains 404-related messages
   */
  private async validateUrl(
    url: string,
    pattern?: string,
    category?: string
  ): Promise<IValidationResult> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SitemapValidator/1.0 (PixelPerfect QA Tool)',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;
      const contentType = response.headers.get('content-type') || 'unknown';
      const status = response.status;

      // Check HTTP status
      if (status === 404) {
        return {
          url,
          status,
          issue: 'HTTP 404 - Page not found',
          responseTime,
          contentType,
          pattern,
          category,
        };
      }

      if (status >= 500) {
        return {
          url,
          status,
          issue: `HTTP ${status} - Server error`,
          responseTime,
          contentType,
          pattern,
          category,
        };
      }

      if (status >= 400) {
        return {
          url,
          status,
          issue: `HTTP ${status} - Client error`,
          responseTime,
          contentType,
          pattern,
          category,
        };
      }

      // For successful responses, check content for 404-related messages
      if (status === 200 && contentType.includes('text/html')) {
        const html = await response.text();
        const lowerHtml = html.toLowerCase();

        // Extract only visible HTML content (exclude script tags with React Flight data)
        const visibleHtml = lowerHtml
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

        // Check for title containing 404 indicators
        const titleMatch = lowerHtml.match(/<title[^>]*>([^<]*)<\/title>/i);
        const title = titleMatch ? titleMatch[1].toLowerCase() : '';
        if (
          title.includes('404') ||
          title.includes('not found') ||
          title.includes('page not found')
        ) {
          return {
            url,
            status: 200,
            issue: `Page title indicates 404: "${titleMatch?.[1]}"`,
            responseTime,
            contentType,
            pattern,
            category,
          };
        }

        // Check for h1 containing 404 messages in visible content
        const h1Match = visibleHtml.match(/<h1[^>]*>([^<]*)<\/h1>/gi);
        if (h1Match) {
          for (const h1 of h1Match) {
            const h1Text = h1.replace(/<[^>]*>/g, '').toLowerCase();
            if (
              h1Text.includes('404') ||
              h1Text.includes('not found') ||
              h1Text.includes('page not found')
            ) {
              return {
                url,
                status: 200,
                issue: `H1 indicates 404: "${h1Text}"`,
                responseTime,
                contentType,
                pattern,
                category,
              };
            }
          }
        }

        // Check for structural 404 indicators
        const notFoundIndicators = [
          '>404<',
          '>page not found<',
          '>error 404<',
          'class="error-404"',
          'class="not-found"',
          "class='error-404'",
          "class='not-found'",
        ];

        for (const indicator of notFoundIndicators) {
          if (visibleHtml.includes(indicator)) {
            return {
              url,
              status: 200,
              issue: `Content contains 404 indicator: "${indicator}"`,
              responseTime,
              contentType,
              pattern,
              category,
            };
          }
        }

        // Check for soft 404s - pages that return 200 but show error content
        const soft404Indicators = [
          'this page is not available',
          'page under construction',
          'coming soon',
          'this combination is not supported',
          'content not found',
        ];

        for (const indicator of soft404Indicators) {
          if (visibleHtml.includes(indicator)) {
            return {
              url,
              status: 200,
              issue: `Soft 404 - "${indicator}"`,
              responseTime,
              contentType,
              pattern,
              category,
            };
          }
        }
      }

      // Check for redirects to home or error pages
      if ([301, 302, 307, 308].includes(status)) {
        const location = response.headers.get('location');
        if (location === '/' || location?.includes('404') || location?.includes('error')) {
          return {
            url,
            status,
            issue: `HTTP ${status} - Redirects to: ${location}`,
            responseTime,
            contentType,
            pattern,
            category,
          };
        }
      }

      // Success
      return {
        url,
        status,
        responseTime,
        contentType,
        pattern,
        category,
      };
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          url,
          status: 0,
          issue: `Timeout after ${this.timeout}ms`,
          responseTime: this.timeout,
          pattern,
          category,
        };
      }

      return {
        url,
        status: 0,
        issue: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Date.now() - startTime,
        pattern,
        category,
      };
    }
  }

  /**
   * Add delay between requests
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate all URLs from a sitemap (full mode)
   */
  private async validateSitemapFull(sitemapUrl: string): Promise<void> {
    console.log(`\n📄 Fetching sitemap: ${sitemapUrl}`);

    try {
      const xml = await this.fetchSitemap(sitemapUrl);
      const urls = await this.parseSitemapUrls(xml);

      console.log(`   Found ${urls.length} URLs to validate`);

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i].loc;
        process.stdout.write(`   [${i + 1}/${urls.length}] Checking: ${url.substring(0, 70)}...`);

        const result = await this.validateUrl(url);
        this.results.push(result);

        if (result.issue) {
          process.stdout.write(` ❌ ${result.issue}\n`);
        } else {
          process.stdout.write(` ✅ OK (${result.responseTime}ms)\n`);
        }

        // Add delay to avoid rate limiting
        if (i < urls.length - 1) {
          await this.delay(this.requestDelay);
        }
      }
    } catch (error: unknown) {
      console.error(
        `   ❌ Failed to process sitemap: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate pattern samples from a sitemap (patterns-only mode)
   */
  private async validateSitemapPatterns(sitemapUrl: string): Promise<IPatternGroup[]> {
    console.log(`\n📄 Fetching sitemap: ${sitemapUrl}`);

    try {
      const xml = await this.fetchSitemap(sitemapUrl);
      const urls = await this.parseSitemapUrls(xml);
      const patterns = this.groupUrlsByPattern(urls);

      console.log(`   Found ${urls.length} URLs grouped into ${patterns.length} patterns`);

      for (let i = 0; i < patterns.length; i++) {
        const group = patterns[i];
        const displayPattern =
          group.pattern.length > 45 ? group.pattern.substring(0, 42) + '...' : group.pattern;

        process.stdout.write(
          `   [${i + 1}/${patterns.length}] Pattern: ${displayPattern.padEnd(45)} (${group.urls.length} URLs) ...`
        );

        const result = await this.validateUrl(group.sampleUrl, group.pattern);
        this.results.push(result);

        if (result.issue) {
          process.stdout.write(` ❌ ${result.issue}\n`);
        } else {
          process.stdout.write(` ✅ OK (${result.responseTime}ms)\n`);
        }

        // Add delay to avoid rate limiting
        if (i < patterns.length - 1) {
          await this.delay(this.requestDelay);
        }
      }

      return patterns;
    } catch (error: unknown) {
      console.error(
        `   ❌ Failed to process sitemap: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return [];
    }
  }

  /**
   * Validate one page per category from a sitemap (one-per-category mode)
   */
  private async validateSitemapByCategory(sitemapUrl: string): Promise<ICategoryGroup[]> {
    console.log(`\n📄 Fetching sitemap: ${sitemapUrl}`);

    try {
      const xml = await this.fetchSitemap(sitemapUrl);
      const urls = await this.parseSitemapUrls(xml);
      const categories = this.groupUrlsByCategory(urls);

      console.log(`   Found ${urls.length} URLs grouped into ${categories.length} categories`);

      for (let i = 0; i < categories.length; i++) {
        const group = categories[i];
        process.stdout.write(
          `   [${i + 1}/${categories.length}] Category: ${group.category.padEnd(20)} (${group.urls.length} URLs) ...`
        );

        const result = await this.validateUrl(group.sampleUrl, undefined, group.category);
        this.results.push(result);

        if (result.issue) {
          process.stdout.write(` ❌ ${result.issue}\n`);
        } else {
          process.stdout.write(` ✅ OK (${result.responseTime}ms)\n`);
        }

        if (i < categories.length - 1) {
          await this.delay(this.requestDelay);
        }
      }

      return categories;
    } catch (error: unknown) {
      console.error(
        `   ❌ Failed to process sitemap: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return [];
    }
  }

  /**
   * Main validation process
   */
  public async validate(): Promise<ISitemapValidationReport> {
    console.log(`\n🔍 Starting sitemap validation for: ${this.baseUrl}`);
    console.log(`📋 Mode: ${this.mode}`);
    console.log(`⏱️  Request delay: ${this.requestDelay}ms`);
    console.log(`⏰ Timeout per request: ${this.timeout}ms\n`);

    const sitemapIndexUrl = `${this.baseUrl}/sitemap.xml`;
    let allPatterns: IPatternGroup[] = [];
    let allCategories: ICategoryGroup[] = [];
    let totalUrlCount = 0;

    try {
      // Fetch sitemap index
      console.log(`📑 Fetching sitemap index: ${sitemapIndexUrl}`);
      const indexXml = await this.fetchSitemap(sitemapIndexUrl);
      const sitemapUrls = await this.parseSitemapIndex(indexXml);

      if (sitemapUrls.length === 0) {
        console.log(`   ⚠️  No nested sitemaps found, treating as single sitemap`);
        if (this.mode === 'patterns-only') {
          const patterns = await this.validateSitemapPatterns(sitemapIndexUrl);
          allPatterns = patterns;
          totalUrlCount = patterns.reduce((sum, p) => sum + p.urls.length, 0);
        } else if (this.mode === 'one-per-category') {
          const categories = await this.validateSitemapByCategory(sitemapIndexUrl);
          allCategories = categories;
          totalUrlCount = categories.reduce((sum, c) => sum + c.urls.length, 0);
        } else {
          await this.validateSitemapFull(sitemapIndexUrl);
          totalUrlCount = this.results.length;
        }
      } else {
        console.log(`   Found ${sitemapUrls.length} nested sitemaps\n`);

        // Rewrite sitemap URLs to use baseUrl instead of production
        const rewrittenSitemapUrls = sitemapUrls.map(url => {
          try {
            const urlObj = new URL(url);
            // Replace the production URL with localhost
            return `${this.baseUrl}${urlObj.pathname}`;
          } catch {
            return url;
          }
        });

        // Process each nested sitemap
        for (const sitemapUrl of rewrittenSitemapUrls) {
          if (this.mode === 'patterns-only') {
            const patterns = await this.validateSitemapPatterns(sitemapUrl);
            // Merge patterns, combining URL counts for same patterns
            for (const newPattern of patterns) {
              const existing = allPatterns.find(p => p.pattern === newPattern.pattern);
              if (existing) {
                existing.urls.push(...newPattern.urls);
              } else {
                allPatterns.push(newPattern);
              }
            }
          } else if (this.mode === 'one-per-category') {
            const categories = await this.validateSitemapByCategory(sitemapUrl);
            // Merge categories
            for (const newCategory of categories) {
              const existing = allCategories.find(c => c.category === newCategory.category);
              if (existing) {
                existing.urls.push(...newCategory.urls);
              } else {
                allCategories.push(newCategory);
              }
            }
          } else {
            await this.validateSitemapFull(sitemapUrl);
          }
        }

        if (this.mode === 'patterns-only') {
          totalUrlCount = allPatterns.reduce((sum, p) => sum + p.urls.length, 0);
        } else if (this.mode === 'one-per-category') {
          totalUrlCount = allCategories.reduce((sum, c) => sum + c.urls.length, 0);
        } else {
          totalUrlCount = this.results.length;
        }
      }
    } catch (error: unknown) {
      console.error(
        `\n❌ Failed to fetch sitemap index: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      process.exit(1);
    }

    // Generate report
    const errors = this.results.filter(r => r.issue && r.status !== 200);
    const warnings = this.results.filter(r => r.issue && r.status === 200);

    const report: ISitemapValidationReport = {
      totalUrls: totalUrlCount,
      testedUrls: this.results.length,
      successfulUrls: this.results.filter(r => !r.issue).length,
      failedUrls: errors.length,
      errors,
      warnings,
      patterns: this.mode === 'patterns-only' ? allPatterns : undefined,
      categories: this.mode === 'one-per-category' ? allCategories : undefined,
      timestamp: new Date().toISOString(),
      mode: this.mode,
    };

    return report;
  }

  /**
   * Print formatted report
   */
  public printReport(report: ISitemapValidationReport): void {
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                   SITEMAP VALIDATION REPORT                   ');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`Base URL: ${this.baseUrl}`);
    console.log(`Mode: ${report.mode}`);
    console.log('───────────────────────────────────────────────────────────────');
    console.log(`Total URLs in sitemap: ${report.totalUrls}`);
    console.log(`URLs tested: ${report.testedUrls}`);
    console.log(
      `✅ Successful: ${report.successfulUrls} (${((report.successfulUrls / report.testedUrls) * 100).toFixed(1)}%)`
    );
    console.log(`⚠️  Warnings: ${report.warnings.length}`);
    console.log(`❌ Errors: ${report.failedUrls}`);

    if (report.mode === 'patterns-only' && report.patterns) {
      console.log('───────────────────────────────────────────────────────────────');
      console.log(`Unique patterns: ${report.patterns.length}`);
      console.log('\nPattern Summary:');
      for (const pattern of report.patterns) {
        const result = this.results.find(r => r.pattern === pattern.pattern);
        const status = result?.issue ? '❌' : '✅';
        console.log(`  ${status} ${pattern.pattern.padEnd(48)} (${pattern.urls.length} URLs)`);
      }
    }

    if (report.mode === 'one-per-category' && report.categories) {
      console.log('───────────────────────────────────────────────────────────────');
      console.log(`Unique categories tested: ${report.categories.length}`);
      console.log(`Total URLs covered: ${report.totalUrls}`);
      console.log(`\n💡 Tested one URL per category. All category pages use the same template.`);
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    if (report.errors.length > 0) {
      console.log('❌ ERRORS (HTTP errors and network failures):\n');
      report.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.url}`);
        if (error.pattern) {
          console.log(`   Pattern: ${error.pattern}`);
        }
        if (error.category) {
          console.log(`   Category: ${error.category}`);
        }
        console.log(`   Status: ${error.status}`);
        console.log(`   Issue: ${error.issue}`);
        console.log(`   Response Time: ${error.responseTime}ms`);
        console.log(`   Content-Type: ${error.contentType || 'unknown'}\n`);
      });
    }

    if (report.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS (200 OK but contains 404-related content):\n');
      report.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning.url}`);
        if (warning.pattern) {
          console.log(`   Pattern: ${warning.pattern}`);
        }
        if (warning.category) {
          console.log(`   Category: ${warning.category}`);
        }
        console.log(`   Status: ${warning.status}`);
        console.log(`   Issue: ${warning.issue}`);
        console.log(`   Response Time: ${warning.responseTime}ms\n`);
      });
    }

    if (report.errors.length === 0 && report.warnings.length === 0) {
      console.log('🎉 All URLs validated successfully! No issues found.\n');
    }

    // Export to file
    const outputPath = path.join(__dirname, '../', 'sitemap-validation-report.json');
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`📄 Full report exported to: ${outputPath}\n`);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const baseUrlArg = args.find(arg => arg.startsWith('--base-url='));
  const portArg = args.find(arg => arg.startsWith('--port='));
  const delayArg = args.find(arg => arg.startsWith('--delay='));

  const baseUrl = baseUrlArg
    ? baseUrlArg.split('=')[1]
    : portArg
      ? `http://localhost:${portArg.split('=')[1]}`
      : 'http://localhost:3000';
  const delay = delayArg ? parseInt(delayArg.split('=')[1], 10) : undefined;

  // Determine mode
  let mode: 'full' | 'patterns-only' | 'one-per-category' = 'one-per-category'; // Default to one-per-category (fast)
  if (args.includes('--full')) {
    mode = 'full';
  } else if (args.includes('--patterns-only')) {
    mode = 'patterns-only';
  } else if (args.includes('--one-per-category')) {
    mode = 'one-per-category';
  }

  const validator = new SitemapValidator(baseUrl, mode, delay);

  try {
    const report = await validator.validate();
    validator.printReport(report);

    // Exit with error code if there are failures
    if (report.failedUrls > 0) {
      process.exit(1);
    }
  } catch (error: unknown) {
    console.error(
      `\n❌ Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    if (error instanceof Error) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
