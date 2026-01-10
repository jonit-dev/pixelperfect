import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getFormatData, getAllFormatSlugs } from '@/lib/seo/data-loader';
import { FormatPageTemplate } from '@/app/(pseo)/_components/pseo/templates/FormatPageTemplate';
import { SchemaMarkup } from '@/app/(pseo)/_components/seo/SchemaMarkup';
import { HreflangLinks } from '@client/components/seo/HreflangLinks';
import { SeoMetaTags } from '@client/components/seo/SeoMetaTags';
import { getCanonicalUrl } from '@/lib/seo/hreflang-generator';
import { clientEnv } from '@shared/config/env';

interface IFormatPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllFormatSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: IFormatPageProps): Promise<Metadata> {
  const { slug } = await params;
  const format = await getFormatData(slug);

  if (!format) return {};

  const path = `/formats/${slug}`;
  const canonicalUrl = getCanonicalUrl(path);

  return {
    title: format.metaTitle,
    description: format.metaDescription,
    openGraph: {
      title: format.metaTitle,
      description: format.metaDescription,
      type: 'website',
      url: canonicalUrl,
      siteName: clientEnv.APP_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title: format.metaTitle,
      description: format.metaDescription,
      creator: `@${clientEnv.TWITTER_HANDLE}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function FormatPage({ params }: IFormatPageProps) {
  const { slug } = await params;
  const format = await getFormatData(slug);

  if (!format) {
    notFound();
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: format.metaTitle,
    description: format.metaDescription,
    url: `${clientEnv.BASE_URL}/formats/${slug}`,
    inLanguage: 'en',
    isPartOf: {
      '@type': 'WebSite',
      name: clientEnv.APP_NAME,
      url: clientEnv.BASE_URL,
    },
  };

  const path = `/formats/${slug}`;

  return (
    <>
      {/* SEO meta tags - canonical and og:locale */}
      <SeoMetaTags path={path} locale="en" />
      {/* Hreflang links for multi-language SEO */}
      <HreflangLinks path={path} />
      <SchemaMarkup schema={schema} />
      <FormatPageTemplate data={format} locale="en" />
    </>
  );
}
