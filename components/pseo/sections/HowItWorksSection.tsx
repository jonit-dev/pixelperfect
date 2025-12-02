/**
 * How It Works Section Component
 * Based on PRD-PSEO-05: Component Library
 */

import type { IHowItWorksStep } from '@/lib/seo/pseo-types';
import { StepCard } from '../ui/StepCard';
import { ReactElement } from 'react';

interface IHowItWorksSectionProps {
  steps: IHowItWorksStep[];
  title?: string;
}

export function HowItWorksSection({
  steps,
  title = 'How It Works',
}: IHowItWorksSectionProps): ReactElement {
  if (!steps || steps.length === 0) {
    return <></>;
  }

  return (
    <section className="my-16">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{title}</h2>
      <div className="max-w-3xl mx-auto space-y-8">
        {steps.map((step, index) => (
          <StepCard key={index} step={step} />
        ))}
      </div>
    </section>
  );
}
