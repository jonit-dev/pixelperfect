import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AllocationChart } from '../../../src/components/AllocationChart';
import { Card } from '../../../src/components/common/Card';
import { JsonLd } from '../../../src/components/seo/JsonLd';
import { AssetTable } from '../../../src/components/tables/AssetTable';
import { getAssetsByCategory, getCategories, getCategoryById } from '../../../src/lib/data';

type Props = {
  params: { category: string };
};

export async function generateStaticParams() {
  const categories = getCategories();

  return categories.map(category => ({
    category: category.id,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = getCategoryById(params.category);

  if (!category) {
    return {
      title: 'Category Not Found',
      description: 'The requested portfolio category could not be found',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const pageUrl = `${baseUrl}/portfolio/${params.category}`;

  return {
    title: `${category.name} Portfolio`,
    description: `Detailed view of ${category.name} assets and allocation in your portfolio`,
    openGraph: {
      title: `${category.name} Portfolio | PixelPerfect`,
      description: `Detailed view of ${category.name} assets and allocation in your portfolio`,
      url: pageUrl,
      type: 'website',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `${category.name} Portfolio`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.name} Portfolio | PixelPerfect`,
      description: `Detailed view of ${category.name} assets and allocation in your portfolio`,
      images: ['/og-image.png'],
    },
    alternates: {
      canonical: pageUrl,
    },
  };
}

export default function CategoryPage({ params }: Props) {
  const category = getCategoryById(params.category);

  if (!category) {
    notFound();
  }

  const assets = getAssetsByCategory(params.category);
  const totalValue = assets.reduce((sum, asset) => sum + asset.valueCAD, 0);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} Portfolio`,
    description: `Detailed view of ${category.name} assets and allocation in your portfolio`,
    url: `${baseUrl}/portfolio/${params.category}`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Portfolio',
          item: `${baseUrl}/portfolio`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: category.name,
          item: `${baseUrl}/portfolio/${params.category}`,
        },
      ],
    },
  };

  return (
    <>
      <JsonLd data={collectionPageJsonLd} />
      <main className="flex-1">
        <div className="space-y-6">
          <div className="stats shadow bg-base-200 w-full">
            <div className="stat">
              <div className="stat-title">{category.name} Total Value</div>
              <div className="stat-value text-primary">${totalValue.toLocaleString()}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Number of Assets</div>
              <div className="stat-value text-primary">{assets.length}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Category Allocation" className="lg:col-span-1">
              <AllocationChart assets={assets} />
            </Card>

            <Card title={`Assets in ${category.name}`} className="lg:col-span-2">
              <AssetTable assets={assets} />
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
