/**
 * Features Section Component
 * Based on PRD-PSEO-05 Section 3.2: Features Section
 */

import type { IFeature } from '@/lib/seo/pseo-types';
import { FeatureCard } from '../ui/FeatureCard';
import { ReactElement } from 'react';

interface IFeaturesSectionProps {
  features: IFeature[];
  title?: string;
}

export function FeaturesSection({
  features,
  title = 'Key Features',
}: IFeaturesSectionProps): ReactElement {
  if (!features || features.length === 0) {
    return <></>;
  }

  return (
    <section className="my-16">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{title}</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <FeatureCard key={index} feature={feature} />
        ))}
      </div>
    </section>
  );
}
