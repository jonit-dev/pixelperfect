import Link from 'next/link';
import { getAllContentPages } from '@/lib/seo/data-loader';
import { generateCategoryMetadata } from '@/lib/seo/metadata-factory';

export const metadata = generateCategoryMetadata('content');

export default async function ContentHubPage() {
  const pages = await getAllContentPages();

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-6">Content-Type Image Enhancement</h1>
      <p className="text-xl text-text-secondary mb-12">
        Specialized upscaling for different types of content and use cases
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pages.map(page => (
          <Link
            key={page.slug}
            href={`/content/${page.slug}`}
            className="block p-6 bg-surface rounded-lg border border hover:border-accent hover:shadow-lg transition-all"
          >
            <h2 className="text-xl font-semibold mb-2">{page.title}</h2>
            <p className="text-gray-600 text-sm">{page.intro?.substring(0, 150)}...</p>
            <span className="inline-block mt-4 text-accent text-sm font-medium">Learn more →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
