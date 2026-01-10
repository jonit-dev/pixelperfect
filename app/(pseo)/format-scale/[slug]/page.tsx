import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getFormatScaleData, getAllFormatScaleSlugs } from '@/lib/seo/data-loader';
import { FormatScalePageTemplate } from '@/app/(pseo)/_components/pseo/templates/FormatScalePageTemplate';
import { SchemaMarkup } from '@/app/(pseo)/_components/seo/SchemaMarkup';
import { HreflangLinks } from '@client/components/seo/HreflangLinks';
import { SeoMetaTags } from '@client/components/seo/SeoMetaTags';
import { getCanonicalUrl } from '@/lib/seo/hreflang-generator';
import { clientEnv } from '@shared/config/env';

interface IFormatScalePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllFormatScaleSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: IFormatScalePageProps): Promise<Metadata> {
  const { slug } = await params;
  const formatScale = await getFormatScaleData(slug);

  if (!formatScale) return {};

  const path = `/format-scale/${slug}`;
  const canonicalUrl = getCanonicalUrl(path);

  return {
    title: formatScale.metaTitle,
    description: formatScale.metaDescription,
    openGraph: {
      title: formatScale.metaTitle,
      description: formatScale.metaDescription,
      type: 'website',
      url: canonicalUrl,
      siteName: clientEnv.APP_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title: formatScale.metaTitle,
      description: formatScale.metaDescription,
      creator: `@${clientEnv.TWITTER_HANDLE}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function FormatScalePage({ params }: IFormatScalePageProps) {
  const { slug } = await params;
  const formatScale = await getFormatScaleData(slug);

  if (!formatScale) {
    notFound();
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: formatScale.metaTitle,
    description: formatScale.metaDescription,
    url: `${clientEnv.BASE_URL}/format-scale/${slug}`,
    inLanguage: 'en',
    isPartOf: {
      '@type': 'WebSite',
      name: clientEnv.APP_NAME,
      url: clientEnv.BASE_URL,
    },
  };

  const path = `/format-scale/${slug}`;

  return (
    <>
      {/* SEO meta tags - canonical and og:locale */}
      <SeoMetaTags path={path} locale="en" />
      {/* Hreflang links for multi-language SEO */}
      <HreflangLinks path={path} />
      <SchemaMarkup schema={schema} />
      <FormatScalePageTemplate data={formatScale} locale="en" />
    </>
  );
}
