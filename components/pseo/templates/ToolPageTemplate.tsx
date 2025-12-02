/**
 * Tool Page Template Component
 * Based on PRD-PSEO-05 Section 2.1: Tool Page Template
 * Comprehensive template for tool landing pages
 */

import type { IToolPage } from '@/lib/seo/pseo-types';
import { BreadcrumbNav } from '../ui/BreadcrumbNav';
import { HeroSection } from '../sections/HeroSection';
import { FeaturesSection } from '../sections/FeaturesSection';
import { BenefitsSection } from '../sections/BenefitsSection';
import { UseCasesSection } from '../sections/UseCasesSection';
import { HowItWorksSection } from '../sections/HowItWorksSection';
import { FAQSection } from '../sections/FAQSection';
import { CTASection } from '../sections/CTASection';
import { PSEOPageTracker } from '../analytics/PSEOPageTracker';
import { ScrollTracker } from '../analytics/ScrollTracker';
import { ReactElement } from 'react';
import { getTierByVolume } from '@/lib/seo/keyword-tiers';

interface IToolPageTemplateProps {
  data: IToolPage;
}

export function ToolPageTemplate({ data }: IToolPageTemplateProps): ReactElement {
  // Get tier from keyword data if available
  const tier = data.primaryKeyword ? getTierByVolume(100000).tier : undefined; // Default assumption for tools

  return (
    <div className="min-h-screen bg-white">
      <PSEOPageTracker
        pageType="tool"
        slug={data.slug}
        primaryKeyword={data.primaryKeyword}
        tier={tier}
      />
      <ScrollTracker pageType="tool" slug={data.slug} />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <BreadcrumbNav
          items={[
            { label: 'Home', href: '/' },
            { label: 'Tools', href: '/tools' },
            { label: data.title, href: `/tools/${data.slug}` },
          ]}
        />

        <article>
          <HeroSection
            h1={data.h1}
            intro={data.intro}
            ctaText={data.ctaText}
            ctaUrl={data.ctaUrl}
            pageType="tool"
            slug={data.slug}
          />

          {data.description && (
            <div className="max-w-4xl mx-auto my-12">
              <p className="text-lg text-gray-700 leading-relaxed">{data.description}</p>
            </div>
          )}

          <FeaturesSection features={data.features} />

          <HowItWorksSection steps={data.howItWorks} />

          <BenefitsSection benefits={data.benefits} />

          <UseCasesSection useCases={data.useCases} />

          <FAQSection faqs={data.faq} pageType="tool" slug={data.slug} />

          <CTASection
            title="Ready to enhance your images?"
            description="Start upscaling images with AI today. No credit card required."
            ctaText={data.ctaText}
            ctaUrl={data.ctaUrl}
            pageType="tool"
            slug={data.slug}
          />
        </article>
      </div>
    </div>
  );
}
