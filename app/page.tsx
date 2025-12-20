import { Metadata } from 'next';
import { Suspense } from 'react';
import { HomePageClient } from '@client/components/pages/HomePageClient';
import { clientEnv } from '@shared/config/env';
import { JsonLd } from '@client/components/seo/JsonLd';
import { generateHomepageSchema } from '@lib/seo/schema-generator';

export const metadata: Metadata = {
  title: `${clientEnv.APP_NAME} | Image Upscaling & Enhancement`,
  description:
    'Transform your images with cutting-edge AI. Upscale, enhance, and restore details with professional quality.',
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
