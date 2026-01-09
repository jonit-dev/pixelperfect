import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getToolData, getAllToolSlugs } from '@/lib/seo';
import { ToolPageTemplate } from '@/app/(pseo)/_components/pseo/templates/ToolPageTemplate';
import { InteractiveToolPageTemplate } from '@/app/(pseo)/_components/pseo/templates/InteractiveToolPageTemplate';
import { SchemaMarkup } from '@/app/(pseo)/_components/seo/SchemaMarkup';
import { generateToolSchema } from '@/lib/seo';
import { HreflangLinks } from '@client/components/seo/HreflangLinks';
import { getCanonicalUrl, getOpenGraphLocale } from '@/lib/seo/hreflang-generator';
import { clientEnv } from '@shared/config/env';

interface IToolPageProps {
  params: Promise<{ slug: string }>;
}

// Generate static paths at build time
export async function generateStaticParams() {
  const slugs = await getAllToolSlugs();
  return slugs.map(slug => ({ slug }));
}

// Generate metadata using factory (but WITHOUT alternates to avoid duplicate hreflang links)
export async function generateMetadata({ params }: IToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolData(slug);

  if (!tool) return {};

  const path = `/tools/${slug}`;
  const canonicalUrl = getCanonicalUrl(path);
  const ogLocale = getOpenGraphLocale('en');

  return {
    title: tool.metaTitle,
    description: tool.metaDescription,
    openGraph: {
      title: tool.metaTitle,
      description: tool.metaDescription,
      type: 'website',
      url: canonicalUrl,
      siteName: clientEnv.APP_NAME,
      locale: ogLocale,
    },
    twitter: {
      card: 'summary_large_image',
      title: tool.metaTitle,
      description: tool.metaDescription,
      creator: `@${clientEnv.TWITTER_HANDLE}`,
    },
    alternates: {
      canonical: canonicalUrl,
      // NOTE: We don't set languages here because we use HreflangLinks component instead
      // This avoids the issue where Next.js renders hrefLang (capital L) instead of hreflang
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ToolPage({ params }: IToolPageProps) {
  const { slug } = await params;
  const tool = await getToolData(slug);

  if (!tool) {
    notFound();
  }

  const schema = generateToolSchema(tool, 'en');
  const path = `/tools/${slug}`;

  // Use InteractiveToolPageTemplate for tools with embedded functionality
  const Template = tool.isInteractive ? InteractiveToolPageTemplate : ToolPageTemplate;

  return (
    <>
      {/* Hreflang links for multi-language SEO */}
      <HreflangLinks path={path} />
      <SchemaMarkup schema={schema} />
      <Template data={tool} />
    </>
  );
}
