import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getScaleData, getAllScaleSlugs } from '@/lib/seo/data-loader';
import { generateMetadata as generatePageMetadata } from '@/lib/seo/metadata-factory';

interface IScalePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllScaleSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: IScalePageProps): Promise<Metadata> {
  const { slug } = await params;
  const scale = await getScaleData(slug);

  if (!scale) return {};

  return generatePageMetadata(scale, 'scale');
}

export default async function ScalePage({ params }: IScalePageProps) {
  const { slug } = await params;
  const scale = await getScaleData(slug);

  if (!scale) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-6">{scale.h1}</h1>
      <p className="text-xl text-gray-600 mb-8">{scale.intro}</p>
      <div className="bg-gray-50 p-8 rounded-lg">
        <p className="text-gray-700">Scale content coming soon...</p>
      </div>
    </div>
  );
}
