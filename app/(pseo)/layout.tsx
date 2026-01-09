import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Inter, DM_Sans } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { ClientProviders } from '@client/components/ClientProviders';
import { AhrefsAnalytics } from '@client/components/analytics/AhrefsAnalytics';
import { GoogleAnalytics } from '@client/components/analytics/GoogleAnalytics';
import { Layout } from '@client/components/layout/Layout';
import { DEFAULT_LOCALE } from '@/i18n/config';
import { clientEnv } from '@shared/config/env';
import '@client/styles/index.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

interface IPSEOLayoutProps {
  children: ReactNode;
}

/**
 * Layout for pSEO (programmatic SEO) pages
 *
 * These pages don't have locale prefix (e.g., /tools/ai-image-upscaler)
 * and serve as the default English versions for SEO purposes.
 *
 * Provides proper HTML structure with metadata for search engines.
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(clientEnv.BASE_URL),
    alternates: {
      canonical: '/',
      languages: {
        en: '/',
        es: '/es/',
        pt: '/pt/',
        de: '/de/',
        fr: '/fr/',
        it: '/it/',
        ja: '/ja/',
        'x-default': '/',
      },
    },
  };
}

export default async function PSEOLayout({ children }: IPSEOLayoutProps) {
  // Set the locale to English (default) for pSEO pages
  setRequestLocale(DEFAULT_LOCALE);

  // Get messages for the default locale
  const messages = await getMessages();

  return (
    <html
      lang="en"
      className={`${inter.variable} ${dmSans.variable} bg-base`}
      suppressHydrationWarning
    >
      <body
        className={`${inter.className} bg-base text-foreground antialiased selection:bg-accent/20 selection:text-white`}
      >
        <NextIntlClientProvider locale={DEFAULT_LOCALE} messages={messages}>
          <GoogleAnalytics />
          <AhrefsAnalytics />
          <ClientProviders>
            <Layout>{children}</Layout>
          </ClientProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
