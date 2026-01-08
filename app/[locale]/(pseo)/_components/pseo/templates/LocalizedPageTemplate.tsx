/**
 * Localized Page Template Wrapper
 *
 * Wraps pSEO page templates to handle localization logic.
 * Shows EnglishOnlyBanner when page is not available in user's locale.
 */

import type { PSEOPage } from '@/lib/seo/pseo-types';
import type { Locale } from '@/i18n/config';
import { getEnglishPath } from '@/lib/seo/localization-config';
import { EnglishOnlyBanner } from '@client/components/pseo/EnglishOnlyBanner';
import React, { ReactElement } from 'react';

interface ILocalizedPageTemplateProps {
  children: ReactElement;
  locale: Locale;
  pageData: PSEOPage | null;
  category: string;
  slug: string;
}

/**
 * Wrapper component that adds English-only banner when needed
 * Usage:
 * ```tsx
 * <LocalizedPageTemplate locale="es" pageData={data} category="tools" slug="image-upscaler">
 *   <ToolPageTemplate data={data} />
 * </LocalizedPageTemplate>
 * ```
 */
export function LocalizedPageTemplate({
  children,
  locale,
  pageData,
  category,
  slug,
}: ILocalizedPageTemplateProps): ReactElement {
  // If we have page data, render normally
  if (pageData) {
    return children;
  }

  // No page data - show English-only banner
  const englishPath = getEnglishPath(`/${category}/${slug}`);

  return (
    <div className="min-h-screen bg-base relative">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.02) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Background blurs */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(45, 129, 255, 0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        <EnglishOnlyBanner currentLocale={locale} englishPath={englishPath} />

        {/* Optional: Show a message below the banner */}
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold text-text-primary mb-4">
            Page Not Available
          </h1>
          <p className="text-lg text-text-secondary">
            This page is currently only available in English. Please use the link above
            to view the English version.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * HOC to wrap a page template with localization support
 * Usage:
 * ```tsx
 * export default withLocalization(ToolPageTemplate, 'tools');
 * ```
 */
export function withLocalization<T extends { data: PSEOPage }>(
  Component: React.ComponentType<T>,
  category: string
) {
  return function LocalizedWrapper(
    props: T & { locale: Locale; slug: string }
  ): ReactElement {
    const { locale, slug, data, ...rest } = props;

    return (
      <LocalizedPageTemplate
        locale={locale}
        pageData={data}
        category={category}
        slug={slug}
      >
        <Component {...(rest as unknown as T)} data={data} />
      </LocalizedPageTemplate>
    );
  };
}
