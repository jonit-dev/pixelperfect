import { Metadata } from 'next';
import { Suspense } from 'react';
import { HomePageClient } from '@client/components/pages/HomePageClient';
import { JsonLd } from '@client/components/seo/JsonLd';
import { generateHomepageSchema } from '@lib/seo/schema-generator';

export const metadata: Metadata = {
  title: `AI Image Upscaler | Enhance & Upscale Photos Online Free`,
  description:
    'Free AI image upscaler and picture enhancer. Upscale images up to 4x, enhance photo quality, and restore details. No signup required for basic features.',
  openGraph: {
    title: `AI Image Upscaler | Enhance & Upscale Photos Online Free`,
    description:
      'Free AI image upscaler and picture enhancer. Upscale images up to 4x, enhance photo quality, and restore details.',
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
