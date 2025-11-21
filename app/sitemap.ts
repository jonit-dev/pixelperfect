import { MetadataRoute } from 'next';
import { getCategories } from '../src/lib/data';
import { getAllPosts } from '../src/lib/blog';
import { clientEnv } from '@/config/env';

export default function sitemap(): MetadataRoute.Sitemap {
  const categories = getCategories();
  const posts = getAllPosts();
  const baseUrl = clientEnv.BASE_URL;

  const categoryUrls = categories.map(category => ({
    url: `${baseUrl}/portfolio/${category.id}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const blogUrls = posts.map(post => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/upscaler`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...categoryUrls,
    ...blogUrls,
  ];
}
