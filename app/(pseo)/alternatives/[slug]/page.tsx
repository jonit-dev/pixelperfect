import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAlternativeData, getAllAlternativeSlugs } from '@/lib/seo/data-loader';
import { AlternativePageTemplate } from '@/app/(pseo)/_components/pseo/templates/AlternativePageTemplate';
import { SchemaMarkup } from '@/app/(pseo)/_components/seo/SchemaMarkup';
import { HreflangLinks } from '@client/components/seo/HreflangLinks';
import { SeoMetaTags } from '@client/components/seo/SeoMetaTags';
import { getCanonicalUrl } from '@/lib/seo/hreflang-generator';
import { clientEnv } from '@shared/config/env';

interface IAlternativePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllAlternativeSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: IAlternativePageProps): Promise<Metadata> {
  const { slug } = await params;
  const alternative = await getAlternativeData(slug);

  if (!alternative) return {};

  const path = `/alternatives/${slug}`;
  const canonicalUrl = getCanonicalUrl(path);

  return {
    title: alternative.metaTitle,
    description: alternative.metaDescription,
    openGraph: {
      title: alternative.metaTitle,
      description: alternative.metaDescription,
      type: 'website',
      url: canonicalUrl,
      siteName: clientEnv.APP_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title: alternative.metaTitle,
      description: alternative.metaDescription,
      creator: `@${clientEnv.TWITTER_HANDLE}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function AlternativePage({ params }: IAlternativePageProps) {
  const { slug } = await params;
  const alternative = await getAlternativeData(slug);

  if (!alternative) {
    notFound();
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: alternative.metaTitle,
    description: alternative.metaDescription,
    url: `${clientEnv.BASE_URL}/alternatives/${slug}`,
    inLanguage: 'en',
    isPartOf: {
      '@type': 'WebSite',
      name: clientEnv.APP_NAME,
      url: clientEnv.BASE_URL,
    },
  };

  const path = `/alternatives/${slug}`;

  return (
    <>
      {/* SEO meta tags - canonical and og:locale */}
      <SeoMetaTags path={path} locale="en" />
      {/* Hreflang links for multi-language SEO */}
      <HreflangLinks path={path} />
      <SchemaMarkup schema={schema} />
      <AlternativePageTemplate data={alternative} locale="en" />
    </>
  );
}
