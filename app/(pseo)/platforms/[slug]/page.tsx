import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPlatformData, getAllPlatformSlugs } from '@/lib/seo/data-loader';
import { PlatformPageTemplate } from '@/app/(pseo)/_components/pseo/templates/PlatformPageTemplate';
import { SchemaMarkup } from '@/app/(pseo)/_components/seo/SchemaMarkup';
import { HreflangLinks } from '@client/components/seo/HreflangLinks';
import { SeoMetaTags } from '@client/components/seo/SeoMetaTags';
import { getCanonicalUrl } from '@/lib/seo/hreflang-generator';
import { clientEnv } from '@shared/config/env';

interface IPlatformPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllPlatformSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: IPlatformPageProps): Promise<Metadata> {
  const { slug } = await params;
  const platform = await getPlatformData(slug);

  if (!platform) return {};

  const path = `/platforms/${slug}`;
  const canonicalUrl = getCanonicalUrl(path);

  return {
    title: platform.metaTitle,
    description: platform.metaDescription,
    openGraph: {
      title: platform.metaTitle,
      description: platform.metaDescription,
      type: 'website',
      url: canonicalUrl,
      siteName: clientEnv.APP_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title: platform.metaTitle,
      description: platform.metaDescription,
      creator: `@${clientEnv.TWITTER_HANDLE}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function PlatformPage({ params }: IPlatformPageProps) {
  const { slug } = await params;
  const platform = await getPlatformData(slug);

  if (!platform) {
    notFound();
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: platform.metaTitle,
    description: platform.metaDescription,
    url: `${clientEnv.BASE_URL}/platforms/${slug}`,
    inLanguage: 'en',
    isPartOf: {
      '@type': 'WebSite',
      name: clientEnv.APP_NAME,
      url: clientEnv.BASE_URL,
    },
  };

  const path = `/platforms/${slug}`;

  return (
    <>
      {/* SEO meta tags - canonical and og:locale */}
      <SeoMetaTags path={path} locale="en" />
      {/* Hreflang links for multi-language SEO */}
      <HreflangLinks path={path} />
      <SchemaMarkup schema={schema} />
      <PlatformPageTemplate data={platform} locale="en" />
    </>
  );
}
