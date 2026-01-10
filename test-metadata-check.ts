/**
 * Simple script to check metadata generation
 */
import { generateMetadata } from './lib/seo/metadata-factory';

async function testMetadata() {
  const mockTool = {
    slug: 'ai-image-upscaler',
    title: 'AI Image Upscaler',
    metaTitle: 'AI Image Upscaler - Scale Images 4X Online Free',
    metaDescription: 'Scale your images up to 4X resolution with AI.',
    secondaryKeywords: ['ai upscaler', 'image scaling'],
  };

  const metadata = generateMetadata(mockTool, 'tools', 'en');

  console.log('Generated Metadata:');
  console.log(JSON.stringify(metadata, null, 2));

  console.log('\nCanonical URL:', metadata.alternates?.canonical);
  console.log('Hreflang languages:', metadata.alternates?.languages);
}

testMetadata().catch(console.error);
