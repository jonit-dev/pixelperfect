/**
 * pSEO Translation Loaders
 *
 * Loads translations for programmatic SEO pages.
 * Each category has its own loader function.
 */

import type { IToolPage } from '@/lib/seo/pseo-types';
import formats from '@/locales/en/formats.json';
import platforms from '@/locales/en/platforms.json';
import guides from '@/locales/en/guides.json';
import useCases from '@/locales/en/use-cases.json';
import free from '@/locales/en/free.json';
import scale from '@/locales/en/scale.json';
import compare from '@/locales/en/compare.json';
import alternatives from '@/locales/en/alternatives.json';
import formatScale from '@/locales/en/format-scale.json';
import platformFormat from '@/locales/en/platform-format.json';
import deviceUse from '@/locales/en/device-use.json';
import tools from '@/locales/en/tools.json';

export interface IPSEORoute {
  slug: string;
  locale: string;
  category: string;
}

export interface IPSEORouteTranslations {
  [locale: string]: {
    title: string;
    metaTitle?: string;
    metaDescription?: string;
    h1?: string;
    intro?: string;
  };
}

export interface IPSEOPageData {
  slug: string;
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  h1?: string;
  intro?: string;
  category?: string;
}

type ICategoryData = {
  pages: unknown[];
  category?: string;
};

/**
 * Get all pSEO routes across all categories
 * Supported locales: en, es, pt, de, fr, it, ja
 */
export function getAllPSEORoutes(locale: string = 'en'): IPSEORoute[] {
  const categories = [
    { name: 'tools', data: tools as ICategoryData },
    { name: 'formats', data: formats as ICategoryData },
    { name: 'platforms', data: platforms as ICategoryData },
    { name: 'guides', data: guides as ICategoryData },
    { name: 'use-cases', data: useCases as ICategoryData },
    { name: 'free', data: free as ICategoryData },
    { name: 'scale', data: scale as ICategoryData },
    { name: 'compare', data: compare as ICategoryData },
    { name: 'alternatives', data: alternatives as ICategoryData },
    { name: 'format-scale', data: formatScale as ICategoryData },
    { name: 'platform-format', data: platformFormat as ICategoryData },
    { name: 'device-use', data: deviceUse as ICategoryData },
  ];

  const routes: IPSEORoute[] = [];

  for (const category of categories) {
    const pages = category.data?.pages || [];
    for (const page of pages) {
      routes.push({
        slug: (page as { slug: string }).slug,
        locale,
        category: category.name,
      });
    }
  }

  return routes;
}

/**
 * Get page data for a specific slug
 */
export function getPSEOPageData(slug: string): IPSEOPageData | undefined {
  const categories = [
    { name: 'tools', data: tools as ICategoryData },
    { name: 'formats', data: formats as ICategoryData },
    { name: 'platforms', data: platforms as ICategoryData },
    { name: 'guides', data: guides as ICategoryData },
    { name: 'use-cases', data: useCases as ICategoryData },
    { name: 'free', data: free as ICategoryData },
    { name: 'scale', data: scale as ICategoryData },
    { name: 'compare', data: compare as ICategoryData },
    { name: 'alternatives', data: alternatives as ICategoryData },
    { name: 'format-scale', data: formatScale as ICategoryData },
    { name: 'platform-format', data: platformFormat as ICategoryData },
    { name: 'device-use', data: deviceUse as ICategoryData },
  ];

  for (const category of categories) {
    const pages = category.data?.pages || [];
    const page = pages.find((p: unknown) => (p as { slug: string }).slug === slug);
    if (page) {
      return page as IPSEOPageData;
    }
  }

  return undefined;
}

/**
 * Get category data
 */
export function getCategoryData(category: string): ICategoryData | undefined {
  const loaders: Record<string, ICategoryData> = {
    tools,
    formats,
    platforms,
    guides,
    'use-cases': useCases,
    free,
    scale,
    compare,
    alternatives,
    'format-scale': formatScale,
    'platform-format': platformFormat,
    'device-use': deviceUse,
  };

  return loaders[category];
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
  return [
    'tools',
    'formats',
    'platforms',
    'guides',
    'use-cases',
    'free',
    'scale',
    'compare',
    'alternatives',
    'format-scale',
    'platform-format',
    'device-use',
  ];
}

/**
 * Get page by slug from any category
 */
export function getPageBySlug(slug: string): IPSEOPageData | undefined {
  const categories = getAllCategories();

  for (const category of categories) {
    const data = getCategoryData(category);
    if (!data) continue;
    const pages = data.pages || [];
    const page = pages.find((p: unknown) => (p as { slug: string }).slug === slug);
    if (page) {
      return page as IPSEOPageData;
    }
  }

  return undefined;
}

/**
 * Get tool data for a specific slug and locale
 * Used by the tools page template
 * Supported locales: en, es, pt, de, fr, it, ja
 */
export async function getToolDataForLocale(
  slug: string,
  locale: string = 'en'
): Promise<IToolPage | null> {
  let toolData: ICategoryData;
  if (locale === 'en') {
    toolData = tools as ICategoryData;
  } else {
    // eslint-disable-next-line no-restricted-syntax -- Dynamic import needed for locale-specific files
    const imported = await import(`@/locales/${locale}/tools.json`);
    toolData = imported.default || imported;
  }
  const pages = toolData.pages || [];
  const page = pages.find((p: unknown) => (p as { slug: string }).slug === slug);
  return (page as IToolPage | undefined) || null;
}

/**
 * Get all tool slugs for a locale
 * Used for generateStaticParams
 * Supported locales: en, es, pt, de, fr, it, ja
 */
export async function getAllToolSlugsForLocale(locale: string = 'en'): Promise<string[]> {
  let toolData: ICategoryData;
  if (locale === 'en') {
    toolData = tools as ICategoryData;
  } else {
    // eslint-disable-next-line no-restricted-syntax -- Dynamic import needed for locale-specific files
    const imported = await import(`@/locales/${locale}/tools.json`);
    toolData = imported.default || imported;
  }
  return (toolData.pages || []).map((p: unknown) => (p as { slug: string }).slug);
}

// Export individual category loaders
export const loadToolsTranslations = (): ICategoryData => tools;
export const loadFormatsTranslations = (): ICategoryData => formats;
export const loadPlatformsTranslations = (): ICategoryData => platforms;
export const loadGuidesTranslations = (): ICategoryData => guides;
export const loadUseCasesTranslations = (): ICategoryData => useCases;
export const loadFreeTranslations = (): ICategoryData => free;
export const loadScaleTranslations = (): ICategoryData => scale;
export const loadCompareTranslations = (): ICategoryData => compare;
export const loadAlternativesTranslations = (): ICategoryData => alternatives;
export const loadFormatScaleTranslations = (): ICategoryData => formatScale;
export const loadPlatformFormatTranslations = (): ICategoryData => platformFormat;
export const loadDeviceUseTranslations = (): ICategoryData => deviceUse;
