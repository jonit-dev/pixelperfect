/**
 * Country to Locale Mapping
 *
 * Maps ISO 3166-1 alpha-2 country codes to supported locales.
 * Used for geolocation-based auto-redirect via Cloudflare's CF-IPCountry header.
 *
 * Policy: Maps to majority spoken language. Countries with no clear majority
 * or unsupported languages default to English.
 */

import type { Locale } from '@/i18n/config';

/**
 * Complete country to locale mapping
 *
 * Maps countries to their most appropriate locale based on:
 * - Official language(s)
 * - Search volume
 * - Market priority
 */
export const COUNTRY_LOCALE_MAP: Record<string, Locale> = {
  // =====================
  // Portuguese (pt)
  // =====================
  BR: 'pt', // Brazil (highest priority - large market)
  PT: 'pt', // Portugal
  AO: 'pt', // Angola
  MZ: 'pt', // Mozambique
  CV: 'pt', // Cape Verde
  GW: 'pt', // Guinea-Bissau
  ST: 'pt', // São Tomé and Príncipe
  // Note: Timor-Leste (TL) excluded - Portuguese spoken by <25%, defaults to English

  // =====================
  // German (de)
  // =====================
  DE: 'de', // Germany (highest priority - large market)
  AT: 'de', // Austria
  LI: 'de', // Liechtenstein
  CH: 'de', // Switzerland (German-speaking majority - 62%)
  // Note: Luxembourg (LU) moved to French (more commonly used)

  // =====================
  // French (fr)
  // =====================
  FR: 'fr', // France (highest priority - large market)
  MC: 'fr', // Monaco
  LU: 'fr', // Luxembourg (French more commonly used than German)
  // Note: Belgium (BE) excluded - Dutch 60% / French 40%, defaults to English
  // Note: Canada (CA) excluded - English majority, defaults to English
  // Note: Andorra (AD) moved to Spanish (more commonly spoken than French)

  // =====================
  // Italian (it)
  // =====================
  IT: 'it', // Italy
  SM: 'it', // San Marino
  VA: 'it', // Vatican City

  // =====================
  // Japanese (ja)
  // =====================
  JP: 'ja', // Japan

  // =====================
  // Spanish (es)
  // =====================
  ES: 'es', // Spain
  MX: 'es', // Mexico
  AD: 'es', // Andorra (Spanish more commonly spoken than Catalan/French)
  AR: 'es', // Argentina
  CO: 'es', // Colombia
  CL: 'es', // Chile
  PE: 'es', // Peru
  VE: 'es', // Venezuela
  EC: 'es', // Ecuador
  GT: 'es', // Guatemala
  CU: 'es', // Cuba
  BO: 'es', // Bolivia
  DO: 'es', // Dominican Republic
  HN: 'es', // Honduras
  PY: 'es', // Paraguay
  SV: 'es', // El Salvador
  NI: 'es', // Nicaragua
  CR: 'es', // Costa Rica
  PA: 'es', // Panama
  UY: 'es', // Uruguay
  PR: 'es', // Puerto Rico
  GQ: 'es', // Equatorial Guinea
} as const;

/**
 * Get locale from country code
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., 'BR', 'DE', 'JP')
 * @returns Mapped locale if found, undefined otherwise
 *
 * @example
 * ```ts
 * getLocaleFromCountry('BR') // Returns 'pt'
 * getLocaleFromCountry('DE') // Returns 'de'
 * getLocaleFromCountry('CN') // Returns undefined (not supported)
 * ```
 */
export function getLocaleFromCountry(countryCode: string): Locale | undefined {
  // Normalize to uppercase for case-insensitive matching
  const normalized = countryCode.toUpperCase();
  return COUNTRY_LOCALE_MAP[normalized];
}

/**
 * Check if a country code has a mapped locale
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns true if country has a mapped locale
 */
export function hasLocaleMapping(countryCode: string): boolean {
  return getLocaleFromCountry(countryCode) !== undefined;
}

/**
 * Get all countries mapped to a specific locale
 *
 * @param locale - Target locale
 * @returns Array of country codes mapped to the locale
 *
 * @example
 * ```ts
 * getCountriesForLocale('pt') // Returns ['BR', 'PT', 'AO', 'MZ', ...]
 * ```
 */
export function getCountriesForLocale(locale: Locale): string[] {
  return Object.entries(COUNTRY_LOCALE_MAP)
    .filter(([, mappedLocale]) => mappedLocale === locale)
    .map(([country]) => country);
}
