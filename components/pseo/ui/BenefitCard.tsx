/**
 * Benefit Card Component
 * Based on PRD-PSEO-05: Component Library
 */

import type { IBenefit } from '@/lib/seo/pseo-types';
import { ReactElement } from 'react';

interface IBenefitCardProps {
  benefit: IBenefit;
}

export function BenefitCard({ benefit }: IBenefitCardProps): ReactElement {
  return (
    <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-100">
      <h3 className="text-xl font-semibold mb-2 text-purple-900">{benefit.title}</h3>
      <p className="text-gray-700 leading-relaxed mb-3">{benefit.description}</p>
      {benefit.metric && (
        <p className="text-sm font-semibold text-purple-600 bg-white px-3 py-1 rounded-full inline-block">
          {benefit.metric}
        </p>
      )}
    </div>
  );
}
