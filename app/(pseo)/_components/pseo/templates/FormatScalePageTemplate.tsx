/**
 * Format Scale Page Template Component
 * Template for format × scale multiplier pages (JPEG 2x, PNG 4x, etc.)
 */

import type { IFormatScalePage } from '@/lib/seo/pseo-types';
import { getPageMappingByUrl } from '@/lib/seo/keyword-mappings';
import { ReactElement } from 'react';
import { PSEOPageTracker } from '../analytics/PSEOPageTracker';
import { ScrollTracker } from '../analytics/ScrollTracker';
import { BenefitsSection } from '../sections/BenefitsSection';
import { CTASection } from '../sections/CTASection';
import { FAQSection } from '../sections/FAQSection';
import { HeroSection } from '../sections/HeroSection';
import { UseCasesSection } from '../sections/UseCasesSection';
import { BreadcrumbNav } from '../ui/BreadcrumbNav';
import { FadeIn } from '@/app/(pseo)/_components/ui/MotionWrappers';

interface IFormatScalePageTemplateProps {
  data: IFormatScalePage & {
    // Extended fields - bestPractices can be objects in JSON
    bestPractices?: Array<string | { title: string; description: string }>;
  };
  locale?: string;
}

export function FormatScalePageTemplate({
  data,
  locale,
}: IFormatScalePageTemplateProps): ReactElement {
  // Look up tier from keyword mappings
  const pageMapping = getPageMappingByUrl(`/format-scale/${data.slug}`);
  const tier = pageMapping?.tier;

  // Normalize bestPractices to handle both string[] and object[]
  const normalizedBestPractices = data.bestPractices?.map(bp =>
    typeof bp === 'string' ? { title: bp, description: '' } : bp
  );

  return (
    <div className="min-h-screen bg-base relative">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.02) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Background blurs */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(45, 129, 255, 0.08) 0%, transparent 70%)',
        }}
      />

      <PSEOPageTracker
        pageType="format-scale"
        slug={data.slug}
        primaryKeyword={data.primaryKeyword}
        tier={tier}
      />
      <ScrollTracker pageType="format-scale" slug={data.slug} />

      <div className="relative max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Breadcrumb */}
        <div className="pt-6 pb-4">
          <BreadcrumbNav
            items={[
              { label: 'Home', href: locale ? `/${locale}` : '/' },
              {
                label: 'Format Scale',
                href: locale ? `/${locale}/format-scale` : '/format-scale',
              },
              {
                label: `${data.format} ${data.scaleFactor}`,
                href: locale
                  ? `/${locale}/format-scale/${data.slug}`
                  : `/format-scale/${data.slug}`,
              },
            ]}
          />
        </div>

        <article>
          {/* Hero Section */}
          <HeroSection
            h1={data.h1}
            intro={data.intro}
            ctaText="Try Free"
            ctaUrl="/upscaler"
            pageType="format-scale"
            slug={data.slug}
          />

          {/* Format & Scale Info */}
          <FadeIn delay={0.2}>
            <div className="py-8">
              <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
                {data.formatDescription && (
                  <div className="bg-surface-light rounded-xl p-6 border border-border-default">
                    <h3 className="text-lg font-semibold text-text-primary mb-3">
                      About {data.format}
                    </h3>
                    <p className="text-text-secondary text-sm">{data.formatDescription}</p>
                  </div>
                )}
                {data.scaleExpectations && (
                  <div className="bg-surface-light rounded-xl p-6 border border-border-default">
                    <h3 className="text-lg font-semibold text-text-primary mb-3">
                      {data.scaleFactor} Scaling
                    </h3>
                    <p className="text-text-secondary text-sm">{data.scaleExpectations}</p>
                  </div>
                )}
              </div>
            </div>
          </FadeIn>

          {/* Benefits */}
          {data.benefits && data.benefits.length > 0 && (
            <BenefitsSection benefits={data.benefits} />
          )}

          {/* Use Cases */}
          {data.useCases && data.useCases.length > 0 && (
            <UseCasesSection useCases={data.useCases} />
          )}

          {/* Best Practices */}
          {normalizedBestPractices && normalizedBestPractices.length > 0 && (
            <FadeIn delay={0.4}>
              <section className="py-12">
                <h2 className="text-2xl font-semibold text-text-primary text-center mb-8">
                  Best Practices
                </h2>
                <div className="max-w-3xl mx-auto grid gap-4 md:grid-cols-2">
                  {normalizedBestPractices.map((practice, index) => (
                    <div
                      key={index}
                      className="bg-surface-light rounded-xl p-5 border border-border-default"
                    >
                      <h3 className="font-semibold text-text-primary mb-2">{practice.title}</h3>
                      {practice.description && (
                        <p className="text-text-secondary text-sm">{practice.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </FadeIn>
          )}

          {/* Tips */}
          {data.tips && data.tips.length > 0 && (
            <FadeIn delay={0.5}>
              <section className="py-12">
                <h2 className="text-2xl font-semibold text-text-primary text-center mb-8">
                  Pro Tips
                </h2>
                <div className="max-w-3xl mx-auto bg-accent-primary/5 rounded-xl p-6 border border-accent-primary/20">
                  <ul className="space-y-3">
                    {data.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-accent-primary mt-1">💡</span>
                        <span className="text-text-secondary">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </FadeIn>
          )}

          {/* FAQ */}
          {data.faq && data.faq.length > 0 && (
            <FAQSection faqs={data.faq} pageType="format-scale" slug={data.slug} />
          )}

          {/* Final CTA */}
          <div className="py-8">
            <FadeIn>
              <CTASection
                title={`Ready to upscale your ${data.format} images ${data.scaleFactor}?`}
                description="Start enhancing images with AI today. No credit card required."
                ctaText="Try Free"
                ctaUrl="/upscaler"
                pageType="format-scale"
                slug={data.slug}
              />
            </FadeIn>
          </div>
        </article>

        {/* Footer spacing */}
        <div className="pb-16" />
      </div>
    </div>
  );
}
