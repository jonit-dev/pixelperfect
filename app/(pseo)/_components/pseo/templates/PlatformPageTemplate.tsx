/**
 * Platform Page Template Component
 * Template for AI platform integration landing pages (Midjourney, Stable Diffusion, etc.)
 */

import type { IPlatformPage } from '@/lib/seo/pseo-types';
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

interface IPlatformPageTemplateProps {
  data: IPlatformPage;
  locale?: string;
}

export function PlatformPageTemplate({ data, locale }: IPlatformPageTemplateProps): ReactElement {
  // Look up tier from keyword mappings
  const pageMapping = getPageMappingByUrl(`/platforms/${data.slug}`);
  const tier = pageMapping?.tier;

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
        pageType="platform"
        slug={data.slug}
        primaryKeyword={data.primaryKeyword}
        tier={tier}
      />
      <ScrollTracker pageType="platform" slug={data.slug} />

      <div className="relative max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Breadcrumb */}
        <div className="pt-6 pb-4">
          <BreadcrumbNav
            items={[
              { label: 'Home', href: locale ? `/${locale}` : '/' },
              { label: 'Platforms', href: locale ? `/${locale}/platforms` : '/platforms' },
              {
                label: data.platformName || data.title,
                href: locale ? `/${locale}/platforms/${data.slug}` : `/platforms/${data.slug}`,
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
            pageType="platform"
            slug={data.slug}
          />

          {/* Description */}
          {data.description && (
            <FadeIn delay={0.2}>
              <div className="max-w-3xl mx-auto py-8">
                <p className="text-lg text-text-secondary leading-relaxed text-center">
                  {data.description}
                </p>
              </div>
            </FadeIn>
          )}

          {/* Benefits */}
          {data.benefits && data.benefits.length > 0 && (
            <BenefitsSection benefits={data.benefits} />
          )}

          {/* Integration Features */}
          {data.integration && data.integration.length > 0 && (
            <FadeIn delay={0.3}>
              <section className="py-12">
                <h2 className="text-2xl font-semibold text-text-primary text-center mb-8">
                  Integration Features
                </h2>
                <div className="max-w-3xl mx-auto bg-surface-light rounded-xl p-6 border border-border-default">
                  <ul className="space-y-3">
                    {data.integration.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-accent-success mt-1">✓</span>
                        <span className="text-text-secondary">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </FadeIn>
          )}

          {/* Use Cases */}
          {data.useCases && data.useCases.length > 0 && (
            <UseCasesSection useCases={data.useCases} />
          )}

          {/* Workflow Steps */}
          {data.workflowSteps && data.workflowSteps.length > 0 && (
            <FadeIn delay={0.5}>
              <section className="py-12">
                <h2 className="text-2xl font-semibold text-text-primary text-center mb-8">
                  How to Use
                </h2>
                <div className="max-w-3xl mx-auto space-y-4">
                  {data.workflowSteps.map((step, index) => (
                    <div key={index} className="flex gap-4 items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-primary text-white flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1 pb-4 border-b border-border-default last:border-0 pt-1">
                        <p className="text-text-secondary">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </FadeIn>
          )}

          {/* FAQ */}
          {data.faq && data.faq.length > 0 && (
            <FAQSection faqs={data.faq} pageType="platform" slug={data.slug} />
          )}

          {/* Final CTA */}
          <div className="py-8">
            <FadeIn>
              <CTASection
                title={`Ready to enhance your ${data.platformName || 'AI'} images?`}
                description="Start enhancing images with AI today. No credit card required."
                ctaText="Try Free"
                ctaUrl="/upscaler"
                pageType="platform"
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
