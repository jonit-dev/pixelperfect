/**
 * FAQ Accordion Component
 * Based on PRD-PSEO-05 Section 4.2: FAQ Accordion
 * Client component for interactive collapse/expand
 */

'use client';

import { ReactElement } from 'react';

interface IFAQAccordionProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

export function FAQAccordion({
  question,
  answer,
  isOpen,
  onToggle,
}: IFAQAccordionProps): ReactElement {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors duration-200 text-left"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-lg pr-4">{question}</span>
        <svg
          className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-gray-700 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
