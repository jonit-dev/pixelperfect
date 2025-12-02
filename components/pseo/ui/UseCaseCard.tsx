/**
 * Use Case Card Component
 * Based on PRD-PSEO-05: Component Library
 */

import type { IUseCase } from '@/lib/seo/pseo-types';
import { ReactElement } from 'react';

interface IUseCaseCardProps {
  useCase: IUseCase;
}

export function UseCaseCard({ useCase }: IUseCaseCardProps): ReactElement {
  return (
    <div className="p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-300 transition-colors duration-300">
      <h3 className="text-xl font-semibold mb-3">{useCase.title}</h3>
      <p className="text-gray-600 leading-relaxed mb-3">{useCase.description}</p>
      {useCase.example && (
        <p className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
          <span className="font-semibold">Example:</span> {useCase.example}
        </p>
      )}
    </div>
  );
}
