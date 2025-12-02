/**
 * Feature Card Component
 * Based on PRD-PSEO-05 Section 4.1: Feature Card
 */

import type { IFeature } from '@/lib/seo/pseo-types';
import { ReactElement } from 'react';

interface IFeatureCardProps {
  feature: IFeature;
}

export function FeatureCard({ feature }: IFeatureCardProps): ReactElement {
  return (
    <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow duration-300 group">
      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors duration-300">
        <span className="text-2xl">{feature.icon || '✨'}</span>
      </div>
      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
      <p className="text-gray-600 leading-relaxed">{feature.description}</p>
    </div>
  );
}
