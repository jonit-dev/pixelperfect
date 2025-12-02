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
import { ReactElement } from 'react';

interface IToolPageTemplateProps {
  data: IToolPage;
}

export function ToolPageTemplate({ data }: IToolPageTemplateProps): ReactElement {
  return (
    <div className="min-h-screen bg-white">
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

          <FAQSection faqs={data.faq} />

          <CTASection
            title="Ready to enhance your images?"
            description="Start upscaling images with AI today. No credit card required."
            ctaText={data.ctaText}
            ctaUrl={data.ctaUrl}
          />
        </article>
      </div>
    </div>
  );
}
