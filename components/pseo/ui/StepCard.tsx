/**
 * Step Card Component (for How It Works sections)
 * Based on PRD-PSEO-05: Component Library
 */

import type { IHowItWorksStep } from '@/lib/seo/pseo-types';
import { ReactElement } from 'react';

interface IStepCardProps {
  step: IHowItWorksStep;
}

export function StepCard({ step }: IStepCardProps): ReactElement {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
        {step.step}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
        <p className="text-gray-600 leading-relaxed">{step.description}</p>
      </div>
    </div>
  );
}
