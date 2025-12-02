/**
 * CTA (Call to Action) Section Component
 * Based on PRD-PSEO-05: Component Library
 */

'use client';

import Link from 'next/link';
import { ReactElement } from 'react';
import { analytics } from '@client/analytics/analyticsClient';

interface ICTASectionProps {
  title: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  pageType?:
    | 'tool'
    | 'comparison'
    | 'guide'
    | 'useCase'
    | 'alternative'
    | 'format'
    | 'scale'
    | 'free';
  slug?: string;
}

export function CTASection({
  title,
  description,
  ctaText,
  ctaUrl,
  pageType,
  slug,
}: ICTASectionProps): ReactElement {
  function handleCTAClick(): void {
    if (pageType && slug) {
      analytics.track('pseo_cta_clicked', {
        pageType,
        slug,
        elementType: 'cta',
        elementId: 'bottom-cta',
      });
    }
  }

  return (
    <section className="my-16 py-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-center text-white">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
        <p className="text-xl mb-8 text-blue-50">{description}</p>
        <Link
          href={ctaUrl}
          onClick={handleCTAClick}
          className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
        >
          {ctaText}
        </Link>
      </div>
    </section>
  );
}
