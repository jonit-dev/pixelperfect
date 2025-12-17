import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getToolData, getAllToolSlugs, generateMetadata as generatePageMetadata } from '@/lib/seo';
import { ToolPageTemplate } from '@/app/(pseo)/_components/pseo/templates/ToolPageTemplate';
import { SchemaMarkup } from '@/app/(pseo)/_components/seo/SchemaMarkup';
import { generateToolSchema } from '@/lib/seo';

interface IToolPageProps {
  params: Promise<{ slug: string }>;
}

// Generate static paths at build time
export async function generateStaticParams() {
  const slugs = await getAllToolSlugs();
  return slugs.map(slug => ({ slug }));
}

// Generate metadata using factory
export async function generateMetadata({ params }: IToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolData(slug);

  if (!tool) return {};

  return generatePageMetadata(tool, 'tools');
}

export default async function ToolPage({ params }: IToolPageProps) {
  const { slug } = await params;
  const tool = await getToolData(slug);

  if (!tool) {
    notFound();
  }

  const schema = generateToolSchema(tool);

  return (
    <>
      <SchemaMarkup schema={schema} />
      <ToolPageTemplate data={tool} />
    </>
  );
}
