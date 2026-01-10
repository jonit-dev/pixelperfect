import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getUseCaseData, getAllUseCaseSlugs } from '@/lib/seo/data-loader';
import { UseCasePageTemplate } from '@/app/(pseo)/_components/pseo/templates/UseCasePageTemplate';
import { SchemaMarkup } from '@/app/(pseo)/_components/seo/SchemaMarkup';
import { HreflangLinks } from '@client/components/seo/HreflangLinks';
import { SeoMetaTags } from '@client/components/seo/SeoMetaTags';
import { getCanonicalUrl } from '@/lib/seo/hreflang-generator';
import { clientEnv } from '@shared/config/env';

interface IUseCasePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllUseCaseSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: IUseCasePageProps): Promise<Metadata> {
  const { slug } = await params;
  const useCase = await getUseCaseData(slug);

  if (!useCase) return {};

  const path = `/use-cases/${slug}`;
  const canonicalUrl = getCanonicalUrl(path);

  return {
    title: useCase.metaTitle,
    description: useCase.metaDescription,
    openGraph: {
      title: useCase.metaTitle,
      description: useCase.metaDescription,
      type: 'website',
      url: canonicalUrl,
      siteName: clientEnv.APP_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title: useCase.metaTitle,
      description: useCase.metaDescription,
      creator: `@${clientEnv.TWITTER_HANDLE}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function UseCasePage({ params }: IUseCasePageProps) {
  const { slug } = await params;
  const useCase = await getUseCaseData(slug);

  if (!useCase) {
    notFound();
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: useCase.metaTitle,
    description: useCase.metaDescription,
    url: `${clientEnv.BASE_URL}/use-cases/${slug}`,
    inLanguage: 'en',
    isPartOf: {
      '@type': 'WebSite',
      name: clientEnv.APP_NAME,
      url: clientEnv.BASE_URL,
    },
  };

  const path = `/use-cases/${slug}`;

  return (
    <>
      {/* SEO meta tags - canonical and og:locale */}
      <SeoMetaTags path={path} locale="en" />
      {/* Hreflang links for multi-language SEO */}
      <HreflangLinks path={path} />
      <SchemaMarkup schema={schema} />
      <UseCasePageTemplate data={useCase} locale="en" />
    </>
  );
}
