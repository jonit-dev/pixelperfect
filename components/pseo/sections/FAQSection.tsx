/**
 * FAQ Section Component
 * Based on PRD-PSEO-05 Section 3.3: FAQ Section
 * Client component for accordion state management
 */

'use client';

import { useState, ReactElement } from 'react';
import type { IFAQ } from '@/lib/seo/pseo-types';
import { FAQAccordion } from '../ui/FAQAccordion';

interface IFAQSectionProps {
  faqs: IFAQ[];
  title?: string;
}

export function FAQSection({
  faqs,
  title = 'Frequently Asked Questions',
}: IFAQSectionProps): ReactElement {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!faqs || faqs.length === 0) {
    return <></>;
  }

  return (
    <section className="my-16">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{title}</h2>
      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, index) => (
          <FAQAccordion
            key={index}
            question={faq.question}
            answer={faq.answer}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    </section>
  );
}
