import { Metadata } from 'next';
import Features from '@client/components/features/landing/Features';
import { CTASection } from '@client/components/features/landing/CTASection';

export const metadata: Metadata = {
  title: 'Features | PixelPerfect AI - Image Upscaling & Enhancement',
  description:
    'Discover powerful features of PixelPerfect AI: Text preservation, batch processing, ethical AI, lightning fast upscaling, and more.',
};

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-6">
            Powerful Features for
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
              Professional Results
            </span>
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Everything you need to enhance your images with cutting-edge AI technology. From text
            preservation to batch processing, we&apos;ve got you covered.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <Features />

      {/* CTA Section */}
      <CTASection />
    </main>
  );
}
