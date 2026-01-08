import { getRequestConfig } from 'next-intl/server';
import { DEFAULT_LOCALE, isValidLocale } from './i18n/config';
import { isDevelopment } from '@shared/config/env';

/**
 * next-intl configuration
 * This file is automatically discovered by next-intl
 */
// eslint-disable-next-line import/no-default-export
export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !isValidLocale(locale)) {
    locale = DEFAULT_LOCALE;
  }

  // Load all translation files and merge them
  const [
    common,
    dashboard,
    auth,
    pricing,
    defaultCommon,
    defaultDashboard,
    defaultAuth,
    defaultPricing,
  ] = await Promise.all([
    import(`./locales/${locale}/common.json`),
    import(`./locales/${locale}/dashboard.json`),
    import(`./locales/${locale}/auth.json`),
    import(`./locales/${locale}/pricing.json`),
    // Load default locale (English) as fallback
    import(`./locales/${DEFAULT_LOCALE}/common.json`),
    import(`./locales/${DEFAULT_LOCALE}/dashboard.json`),
    import(`./locales/${DEFAULT_LOCALE}/auth.json`),
    import(`./locales/${DEFAULT_LOCALE}/pricing.json`),
  ]);

  const defaultMessages = {
    ...defaultCommon.default,
    dashboard: defaultDashboard.default,
    auth: defaultAuth.default,
    pricing: defaultPricing.default,
  };

  return {
    locale,
    messages: {
      ...common.default,
      dashboard: dashboard.default,
      auth: auth.default,
      pricing: pricing.default,
    },
    getMessageFallback: ({ key, namespace }) => {
      // Try to get the message from default locale (English)
      if (namespace) {
        const defaultMessagesForNamespace = defaultMessages[namespace];
        if (defaultMessagesForNamespace && key in defaultMessagesForNamespace) {
          if (isDevelopment()) {
            console.warn(
              `[i18n] Missing translation: ${namespace}.${key}, falling back to ${DEFAULT_LOCALE}`
            );
          }
          return defaultMessagesForNamespace[key];
        }
      } else if (key in defaultMessages) {
        if (isDevelopment()) {
          console.warn(`[i18n] Missing translation: ${key}, falling back to ${DEFAULT_LOCALE}`);
        }
        return defaultMessages[key];
      }
      // If not found in default locale, return the key as last resort
      if (isDevelopment()) {
        console.warn(`[i18n] Missing translation: ${key}, not found in ${DEFAULT_LOCALE} either`);
      }
      return key;
    },
  };
});
