import Link from 'next/link';
import { getAllPlatforms } from '@/lib/seo/data-loader';
import { generateCategoryMetadata } from '@/lib/seo/metadata-factory';

export const metadata = generateCategoryMetadata('platforms');

export default async function PlatformsHubPage() {
  const platforms = await getAllPlatforms();

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-6">AI Platform Upscalers</h1>
      <p className="text-xl text-text-secondary mb-12">
        Specialized image upscaling for AI-generated art from popular platforms
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms.map(platform => (
          <Link
            key={platform.slug}
            href={`/platforms/${platform.slug}`}
            className="block p-6 bg-surface rounded-lg border border hover:border-accent hover:shadow-lg transition-all"
          >
            <h2 className="text-xl font-semibold mb-2">{platform.title}</h2>
            <p className="text-gray-600 text-sm">{platform.intro?.substring(0, 150)}...</p>
            <span className="inline-block mt-4 text-accent text-sm font-medium">Learn more →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
