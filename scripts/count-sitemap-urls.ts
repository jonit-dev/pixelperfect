#!/usr/bin/env tsx
/**
 * Sitemap URL Counter
 *
 * Crawls all nested sitemaps and counts total URLs
 * Usage: tsx scripts/count-sitemap-urls.ts [base-url]
 *
 * Example:
 *   tsx scripts/count-sitemap-urls.ts https://example.com
 *   tsx scripts/count-sitemap-urls.ts http://localhost:3000
 */

import * as https from 'https';
import * as http from 'http';
import { parseStringPromise } from 'xml2js';

interface ISitemapUrl {
  loc: string[];
  lastmod?: string[];
  changefreq?: string[];
  priority?: string[];
}

interface ISitemapIndex {
  loc: string[];
  lastmod?: string[];
}

interface ISitemap {
  urlset?: {
    url?: ISitemapUrl[];
  };
  sitemapindex?: {
    sitemap?: ISitemapIndex[];
  };
}

interface ICategoryStats {
  sitemapName: string;
  urlCount: number;
  percentage: number;
}

interface ILocaleStats {
  locale: string;
  urlCount: number;
  sitemaps: number;
}

class SitemapCrawler {
  private baseUrl: string;
  private visitedUrls = new Set<string>();
  private totalUrls = 0;
  private sitemapBreakdown: Record<string, number> = {};
  private localeBreakdown: Record<string, number> = {};

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Extract locale from sitemap URL
   * e.g., sitemap-tools-es.xml -> es
   */
  private extractLocaleFromSitemap(url: string): string {
    const match = url.match(/sitemap-[\w-]+-([a-z]{2})\.xml/i);
    return match ? match[1] : 'en';
  }

  /**
   * Fetch XML content from URL
   */
  private async fetchXml(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;

      protocol
        .get(url, res => {
          if (res.statusCode !== 200) {
            reject(new Error(`Failed to fetch ${url}: ${res.statusCode}`));
            return;
          }

          let data = '';
          res.on('data', chunk => (data += chunk));
          res.on('end', () => resolve(data));
        })
        .on('error', reject);
    });
  }

  /**
   * Parse sitemap XML
   */
  private async parseSitemap(url: string): Promise<ISitemap> {
    console.log(`📥 Fetching: ${url}`);
    const xml = await this.fetchXml(url);
    return await parseStringPromise(xml);
  }

  /**
   * Process a sitemap (can be index or urlset)
   */
  private async processSitemap(url: string): Promise<void> {
    // Avoid visiting the same sitemap twice
    if (this.visitedUrls.has(url)) {
      return;
    }
    this.visitedUrls.add(url);

    try {
      const sitemap = await this.parseSitemap(url);

      // Check if it's a sitemap index (contains nested sitemaps)
      if (sitemap.sitemapindex?.sitemap) {
        console.log(
          `📂 Sitemap Index found with ${sitemap.sitemapindex.sitemap.length} nested sitemaps`
        );

        // Process each nested sitemap
        for (const nestedSitemap of sitemap.sitemapindex.sitemap) {
          const nestedUrl = nestedSitemap.loc[0];
          await this.processSitemap(nestedUrl);
        }
      }
      // Check if it's a URL set (contains actual URLs)
      else if (sitemap.urlset?.url) {
        const urlCount = sitemap.urlset.url.length;
        this.totalUrls += urlCount;

        // Track breakdown by sitemap
        const sitemapName = url.split('/').pop() || url;
        this.sitemapBreakdown[sitemapName] = urlCount;

        // Track by locale
        const locale = this.extractLocaleFromSitemap(url);
        this.localeBreakdown[locale] = (this.localeBreakdown[locale] || 0) + urlCount;

        console.log(`✅ Found ${urlCount} URLs in ${sitemapName}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${url}:`, error instanceof Error ? error.message : error);
    }
  }

  /**
   * Start crawling from the main sitemap
   */
  public async crawl(): Promise<void> {
    console.log(`\n🔍 Starting sitemap crawl from: ${this.baseUrl}\n`);

    const mainSitemapUrl = `${this.baseUrl}/sitemap.xml`;
    await this.processSitemap(mainSitemapUrl);

    this.printResults();
  }

  /**
   * Print results summary
   */
  private printResults(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SITEMAP CRAWL RESULTS');
    console.log('='.repeat(60));
    console.log(`\n🌐 Base URL: ${this.baseUrl}`);
    console.log(`📄 Total Sitemaps Processed: ${this.visitedUrls.size}`);
    console.log(`🔗 Total URLs Found: ${this.totalUrls}`);

    // Print locale breakdown
    console.log('\n📋 Breakdown by Locale:');
    console.log('-'.repeat(60));
    const sortedLocales = Object.entries(this.localeBreakdown).sort((a, b) => b[1] - a[1]);

    for (const [locale, count] of sortedLocales) {
      const percentage = ((count / this.totalUrls) * 100).toFixed(2);
      console.log(`  ${locale.padEnd(10)} ${count.toString().padStart(6)} URLs (${percentage}%)`);
    }

    // Print sitemap breakdown
    console.log('\n📋 Breakdown by Sitemap:');
    console.log('-'.repeat(60));

    const sorted = Object.entries(this.sitemapBreakdown).sort((a, b) => b[1] - a[1]);

    for (const [name, count] of sorted) {
      const percentage = ((count / this.totalUrls) * 100).toFixed(2);
      console.log(`  ${name.padEnd(35)} ${count.toString().padStart(6)} URLs (${percentage}%)`);
    }

    console.log('='.repeat(60) + '\n');
  }
}

// Main execution
async function main() {
  // Get base URL from command line or use default
  const baseUrl = process.argv[2] || 'http://localhost:3000';

  const crawler = new SitemapCrawler(baseUrl);
  await crawler.crawl();
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
