/**
 * Benefits Section Component
 * Based on PRD-PSEO-05: Component Library
 */

import type { IBenefit } from '@/lib/seo/pseo-types';
import { BenefitCard } from '../ui/BenefitCard';
import { ReactElement } from 'react';

interface IBenefitsSectionProps {
  benefits: IBenefit[];
  title?: string;
}

export function BenefitsSection({
  benefits,
  title = 'Benefits',
}: IBenefitsSectionProps): ReactElement {
  if (!benefits || benefits.length === 0) {
    return <></>;
  }

  return (
    <section className="my-16">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{title}</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {benefits.map((benefit, index) => (
          <BenefitCard key={index} benefit={benefit} />
        ))}
      </div>
    </section>
  );
}
