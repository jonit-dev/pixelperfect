/**
 * Hero Section Component
 * Based on PRD-PSEO-05 Section 3.1: Hero Section
 */

'use client';

import Link from 'next/link';
import { ReactElement } from 'react';
import { analytics } from '@client/analytics/analyticsClient';

interface IHeroSectionProps {
  h1: string;
  intro: string;
  ctaText?: string;
  ctaUrl?: string;
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

export function HeroSection({
  h1,
  intro,
  ctaText,
  ctaUrl,
  pageType,
  slug,
}: IHeroSectionProps): ReactElement {
  function handleCTAClick(): void {
    if (pageType && slug) {
      analytics.track('pseo_cta_clicked', {
        pageType,
        slug,
        elementType: 'cta',
        elementId: 'hero-cta',
      });
    }
  }

  return (
    <section className="py-12 md:py-20">
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {h1}
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-8">{intro}</p>

        {ctaText && ctaUrl && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={ctaUrl}
              onClick={handleCTAClick}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
            >
              {ctaText}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
