/**
 * Hreflang Links Component
 * Generates hreflang alternate links for SEO
 *
 * This component renders hreflang links directly in the page body.
 * Next.js will hoist these <link> tags to the <head> section automatically.
 *
 * NOTE: Next.js renders the attribute as `hrefLang` (camelCase) in the HTML output.
 * This is functionally equivalent to `hreflang` since HTML attributes are case-insensitive.
 * Search engines (Google, Bing) and browsers handle both forms correctly.
 */

import { SUPPORTED_LOCALES } from '@/i18n/config';
import { clientEnv } from '@shared/config/env';
import { getLocalizedPath } from '@/lib/seo/hreflang-generator';

interface IHreflangLinksProps {
  path: string; // Path without locale prefix (e.g., '/tools/ai-image-upscaler')
}

/**
 * Render hreflang alternate links in the head
 * Generates links for all supported locales plus x-default
 *
 * @example
 * ```tsx
 * <HreflangLinks path="/tools/ai-image-upscaler" />
 * ```
 */
export function HreflangLinks({ path }: IHreflangLinksProps): JSX.Element {
  // Ensure path has trailing slash for consistency
  const normalizedPath = path.endsWith('/') ? path : `${path}/`;

  // Generate hreflang links for all supported locales
  const links = SUPPORTED_LOCALES.map(loc => {
    const localizedPath = getLocalizedPath(normalizedPath, loc);
    const url = `${clientEnv.BASE_URL}${localizedPath}`;
    return <link key={loc} rel="alternate" hrefLang={loc} href={url} />;
  });

  // Add x-default pointing to the default locale (English)
  links.push(
    <link
      key="x-default"
      rel="alternate"
      hrefLang="x-default"
      href={`${clientEnv.BASE_URL}${normalizedPath}`}
    />
  );

  // Return fragment with all link tags
  // Next.js will hoist these to the head section automatically
  return <>{links}</>;
}
