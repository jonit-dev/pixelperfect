import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDeviceUseData, getAllDeviceUseSlugs } from '@/lib/seo/data-loader';
import { DeviceUsePageTemplate } from '@/app/(pseo)/_components/pseo/templates/DeviceUsePageTemplate';
import { SchemaMarkup } from '@/app/(pseo)/_components/seo/SchemaMarkup';
import { HreflangLinks } from '@client/components/seo/HreflangLinks';
import { SeoMetaTags } from '@client/components/seo/SeoMetaTags';
import { getCanonicalUrl } from '@/lib/seo/hreflang-generator';
import { clientEnv } from '@shared/config/env';

interface IDeviceUsePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllDeviceUseSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: IDeviceUsePageProps): Promise<Metadata> {
  const { slug } = await params;
  const deviceUse = await getDeviceUseData(slug);

  if (!deviceUse) return {};

  const path = `/device-use/${slug}`;
  const canonicalUrl = getCanonicalUrl(path);

  return {
    title: deviceUse.metaTitle,
    description: deviceUse.metaDescription,
    openGraph: {
      title: deviceUse.metaTitle,
      description: deviceUse.metaDescription,
      type: 'website',
      url: canonicalUrl,
      siteName: clientEnv.APP_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title: deviceUse.metaTitle,
      description: deviceUse.metaDescription,
      creator: `@${clientEnv.TWITTER_HANDLE}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function DeviceUsePage({ params }: IDeviceUsePageProps) {
  const { slug } = await params;
  const deviceUse = await getDeviceUseData(slug);

  if (!deviceUse) {
    notFound();
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: deviceUse.metaTitle,
    description: deviceUse.metaDescription,
    url: `${clientEnv.BASE_URL}/device-use/${slug}`,
    inLanguage: 'en',
    isPartOf: {
      '@type': 'WebSite',
      name: clientEnv.APP_NAME,
      url: clientEnv.BASE_URL,
    },
  };

  const path = `/device-use/${slug}`;

  return (
    <>
      {/* SEO meta tags - canonical and og:locale */}
      <SeoMetaTags path={path} locale="en" />
      {/* Hreflang links for multi-language SEO */}
      <HreflangLinks path={path} />
      <SchemaMarkup schema={schema} />
      <DeviceUsePageTemplate data={deviceUse} locale="en" />
    </>
  );
}
