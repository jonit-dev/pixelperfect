import { Metadata } from 'next';
import HowItWorks from '@client/components/features/landing/HowItWorks';
import { CTASection } from '@client/components/features/landing/CTASection';

export const metadata: Metadata = {
  title: 'How it Works | PixelPerfect AI - Image Upscaling & Enhancement',
  description:
    'Learn how PixelPerfect AI transforms your images in three simple steps: Upload, Process, and Download. Get professional results in seconds.',
};

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-6">
            How it
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
              {' '}
              Works
            </span>
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Transform your workflow in three simple steps. No complex settings, just professional
            results every time.
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorks />

      {/* CTA Section */}
      <CTASection />
    </main>
  );
}
