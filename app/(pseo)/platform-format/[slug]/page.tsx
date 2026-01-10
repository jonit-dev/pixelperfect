import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPlatformFormatData, getAllPlatformFormatSlugs } from '@/lib/seo/data-loader';
import { PlatformFormatPageTemplate } from '@/app/(pseo)/_components/pseo/templates/PlatformFormatPageTemplate';
import { SchemaMarkup } from '@/app/(pseo)/_components/seo/SchemaMarkup';
import { HreflangLinks } from '@client/components/seo/HreflangLinks';
import { SeoMetaTags } from '@client/components/seo/SeoMetaTags';
import { getCanonicalUrl } from '@/lib/seo/hreflang-generator';
import { clientEnv } from '@shared/config/env';

interface IPlatformFormatPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllPlatformFormatSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: IPlatformFormatPageProps): Promise<Metadata> {
  const { slug } = await params;
  const platformFormat = await getPlatformFormatData(slug);

  if (!platformFormat) return {};

  const path = `/platform-format/${slug}`;
  const canonicalUrl = getCanonicalUrl(path);

  return {
    title: platformFormat.metaTitle,
    description: platformFormat.metaDescription,
    openGraph: {
      title: platformFormat.metaTitle,
      description: platformFormat.metaDescription,
      type: 'website',
      url: canonicalUrl,
      siteName: clientEnv.APP_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title: platformFormat.metaTitle,
      description: platformFormat.metaDescription,
      creator: `@${clientEnv.TWITTER_HANDLE}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function PlatformFormatPage({ params }: IPlatformFormatPageProps) {
  const { slug } = await params;
  const platformFormat = await getPlatformFormatData(slug);

  if (!platformFormat) {
    notFound();
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: platformFormat.metaTitle,
    description: platformFormat.metaDescription,
    url: `${clientEnv.BASE_URL}/platform-format/${slug}`,
    inLanguage: 'en',
    isPartOf: {
      '@type': 'WebSite',
      name: clientEnv.APP_NAME,
      url: clientEnv.BASE_URL,
    },
  };

  const path = `/platform-format/${slug}`;

  return (
    <>
      {/* SEO meta tags - canonical and og:locale */}
      <SeoMetaTags path={path} locale="en" />
      {/* Hreflang links for multi-language SEO */}
      <HreflangLinks path={path} />
      <SchemaMarkup schema={schema} />
      <PlatformFormatPageTemplate data={platformFormat} locale="en" />
    </>
  );
}
