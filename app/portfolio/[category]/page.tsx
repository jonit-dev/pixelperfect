import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AllocationChart } from '../../../src/components/AllocationChart';
import { Card } from '../../../src/components/common/Card';
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
      title: 'Category Not Found | PixelPerfect',
    };
  }

  return {
    title: `${category.name} Portfolio | PixelPerfect`,
    description: `Detailed view of ${category.name} assets and allocation in your portfolio`,
  };
}

export default function CategoryPage({ params }: Props) {
  const category = getCategoryById(params.category);

  if (!category) {
    notFound();
  }

  const assets = getAssetsByCategory(params.category);
  const totalValue = assets.reduce((sum, asset) => sum + asset.valueCAD, 0);

  return (
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
  );
}
