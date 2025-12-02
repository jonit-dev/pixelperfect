/**
 * Use Cases Section Component
 * Based on PRD-PSEO-05: Component Library
 */

import type { IUseCase } from '@/lib/seo/pseo-types';
import { UseCaseCard } from '../ui/UseCaseCard';
import { ReactElement } from 'react';

interface IUseCasesSectionProps {
  useCases: IUseCase[];
  title?: string;
}

export function UseCasesSection({
  useCases,
  title = 'Use Cases',
}: IUseCasesSectionProps): ReactElement {
  if (!useCases || useCases.length === 0) {
    return <></>;
  }

  return (
    <section className="my-16">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{title}</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {useCases.map((useCase, index) => (
          <UseCaseCard key={index} useCase={useCase} />
        ))}
      </div>
    </section>
  );
}
