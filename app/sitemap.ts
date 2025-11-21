import { MetadataRoute } from 'next';
import { getCategories } from '../src/lib/data';
import { clientEnv } from '@/config/env';

export default function sitemap(): MetadataRoute.Sitemap {
  const categories = getCategories();
  const baseUrl = clientEnv.BASE_URL;

  const categoryUrls = categories.map(category => ({
    url: `${baseUrl}/portfolio/${category.id}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...categoryUrls,
  ];
}
