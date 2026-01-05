import { Metadata } from 'next';
import { Suspense } from 'react';
import { HomePageClient } from '@client/components/pages/HomePageClient';
import { JsonLd } from '@client/components/seo/JsonLd';
import { generateHomepageSchema } from '@lib/seo/schema-generator';

export const metadata: Metadata = {
  title: `Fix Blurry Images in Seconds | AI Image Upscaler - Free`,
  description:
    'Stop losing clients to pixelated photos. Our AI upscaler reconstructs lost detail and keeps text sharp—no Photoshop skills needed. 10 free credits, results in 30 seconds.',
  openGraph: {
    title: `Fix Blurry Images in Seconds | AI Image Upscaler`,
    description:
      'Stop losing clients to pixelated photos. AI that reconstructs lost detail and keeps text sharp. Try free.',
    type: 'website',
    url: '/',
  },
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  const homepageSchema = generateHomepageSchema();

  return (
    <>
      <JsonLd data={homepageSchema} />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        }
      >
        <HomePageClient />
      </Suspense>
    </>
  );
}
