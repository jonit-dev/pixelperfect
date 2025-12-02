# Component Library

## Sub-PRD 05: React Components for pSEO Pages

| Field               | Value                        |
| ------------------- | ---------------------------- |
| **Parent Document** | [00-index.md](./00-index.md) |
| **Status**          | Draft                        |
| **Priority**        | P1                           |
| **Owner**           | Engineering & Design         |

---

## Overview

This document defines the React component library for PixelPerfect's pSEO implementation. All components are designed to be reusable, performant, and optimized for SEO.

---

## 1. Component Architecture

### 1.1 Design Principles

| Principle         | Description                                           |
| ----------------- | ----------------------------------------------------- |
| **Reusability**   | Components work across all page types                 |
| **Performance**   | Server Components by default, Client only when needed |
| **SEO-Optimized** | Semantic HTML, proper heading hierarchy               |
| **Accessibility** | WCAG 2.1 AA compliant                                 |
| **Type-Safe**     | Strict TypeScript interfaces                          |

### 1.2 Component Hierarchy

```
src/components/pseo/
├── templates/              # Page templates
│   ├── ToolPageTemplate.tsx
│   ├── FormatPageTemplate.tsx
│   ├── ComparisonPageTemplate.tsx
│   ├── UseCasePageTemplate.tsx
│   ├── GuidePageTemplate.tsx
│   ├── AlternativePageTemplate.tsx
│   ├── ScalePageTemplate.tsx
│   └── FreePageTemplate.tsx
│
├── sections/               # Page sections
│   ├── HeroSection.tsx
│   ├── IntroSection.tsx
│   ├── WhatIsSection.tsx
│   ├── HowItWorksSection.tsx
│   ├── FeaturesSection.tsx
│   ├── BenefitsSection.tsx
│   ├── UseCasesSection.tsx
│   ├── FAQSection.tsx
│   ├── CTASection.tsx
│   ├── RelatedSection.tsx
│   └── ComparisonTableSection.tsx
│
├── ui/                     # Reusable UI components
│   ├── FeatureCard.tsx
│   ├── BenefitCard.tsx
│   ├── UseCaseCard.tsx
│   ├── StepCard.tsx
│   ├── FAQAccordion.tsx
│   ├── ComparisonTable.tsx
│   ├── BreadcrumbNav.tsx
│   ├── TableOfContents.tsx
│   ├── ReadingTime.tsx
│   └── ShareButtons.tsx
│
└── utils/                  # Utility components
    ├── SchemaMarkup.tsx
    ├── StructuredData.tsx
    └── PageLayout.tsx
```

---

## 2. Template Components

### 2.1 Tool Page Template

```typescript
// src/components/pseo/templates/ToolPageTemplate.tsx
import type { IToolPage } from '@/types/pseo';
import HeroSection from '@/components/pseo/sections/HeroSection';
import IntroSection from '@/components/pseo/sections/IntroSection';
import WhatIsSection from '@/components/pseo/sections/WhatIsSection';
import HowItWorksSection from '@/components/pseo/sections/HowItWorksSection';
import FeaturesSection from '@/components/pseo/sections/FeaturesSection';
import BenefitsSection from '@/components/pseo/sections/BenefitsSection';
import UseCasesSection from '@/components/pseo/sections/UseCasesSection';
import FAQSection from '@/components/pseo/sections/FAQSection';
import RelatedSection from '@/components/pseo/sections/RelatedSection';
import CTASection from '@/components/pseo/sections/CTASection';
import BreadcrumbNav from '@/components/pseo/ui/BreadcrumbNav';
import PageLayout from '@/components/pseo/utils/PageLayout';

interface IToolPageTemplateProps {
  data: IToolPage;
}

export default function ToolPageTemplate({ data }: IToolPageTemplateProps) {
  return (
    <PageLayout>
      <BreadcrumbNav
        items={[
          { label: 'Home', href: '/' },
          { label: 'Tools', href: '/tools' },
          { label: data.title, href: `/tools/${data.slug}` },
        ]}
      />

      <article className="max-w-4xl mx-auto">
        <HeroSection
          h1={data.h1}
          subtitle={data.heroSubtitle}
          primaryCTA={data.cta.primary}
          secondaryCTA={data.cta.secondary}
        />

        <IntroSection content={data.introduction} />

        <WhatIsSection
          title={data.whatIs.title}
          content={data.whatIs.content}
        />

        <HowItWorksSection
          title={data.howItWorks.title}
          steps={data.howItWorks.steps}
        />

        <FeaturesSection features={data.features} />

        <BenefitsSection benefits={data.benefits} />

        <UseCasesSection useCases={data.useCases} />

        <FAQSection faqs={data.faq} />

        <RelatedSection
          category="tools"
          relatedTools={data.relatedTools}
          relatedGuides={data.relatedGuides}
          relatedFormats={data.relatedFormats}
        />

        <CTASection
          title="Ready to enhance your images?"
          description="Start upscaling images with AI today. No credit card required."
          primaryCTA={data.cta.primary}
          secondaryCTA={data.cta.secondary}
        />
      </article>
    </PageLayout>
  );
}
```

### 2.2 Comparison Page Template

```typescript
// src/components/pseo/templates/ComparisonPageTemplate.tsx
import type { IComparisonPage } from '@/types/pseo';
import HeroSection from '@/components/pseo/sections/HeroSection';
import IntroSection from '@/components/pseo/sections/IntroSection';
import ComparisonTableSection from '@/components/pseo/sections/ComparisonTableSection';
import FAQSection from '@/components/pseo/sections/FAQSection';
import CTASection from '@/components/pseo/sections/CTASection';
import BreadcrumbNav from '@/components/pseo/ui/BreadcrumbNav';
import PageLayout from '@/components/pseo/utils/PageLayout';

interface IComparisonPageTemplateProps {
  data: IComparisonPage;
}

export default function ComparisonPageTemplate({ data }: IComparisonPageTemplateProps) {
  return (
    <PageLayout>
      <BreadcrumbNav
        items={[
          { label: 'Home', href: '/' },
          { label: 'Comparisons', href: '/compare' },
          { label: data.title, href: `/compare/${data.slug}` },
        ]}
      />

      <article className="max-w-5xl mx-auto">
        <HeroSection
          h1={data.h1}
          subtitle={data.introduction}
          variant="comparison"
        />

        <IntroSection content={data.introduction} />

        {/* Quick Comparison Table */}
        <ComparisonTableSection
          title="Quick Comparison"
          rows={data.comparisonTable}
        />

        {/* PixelPerfect Profile */}
        <section className="my-12">
          <h2 className="text-3xl font-bold mb-6">PixelPerfect Overview</h2>
          <div className="prose prose-lg max-w-none">
            <p>{data.pixelperfectProfile?.overview}</p>

            <h3>Key Features</h3>
            <ul>
              {data.pixelperfectProfile?.features.map((feature, i) => (
                <li key={i}>{feature}</li>
              ))}
            </ul>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <h4 className="text-lg font-semibold mb-3 text-green-600">Pros</h4>
                <ul className="space-y-2">
                  {data.pixelperfectProfile?.pros.map((pro, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-3 text-red-600">Cons</h4>
                <ul className="space-y-2">
                  {data.pixelperfectProfile?.cons.map((con, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-red-500 mr-2">✗</span>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mt-6">
              <p className="font-semibold">Pricing: {data.pixelperfectProfile?.pricing}</p>
              <p className="mt-2">Best for: {data.pixelperfectProfile?.bestFor}</p>
            </div>
          </div>
        </section>

        {/* Competitor Profile */}
        {data.competitorProfile && (
          <section className="my-12">
            <h2 className="text-3xl font-bold mb-6">{data.competitor} Overview</h2>
            {/* Similar structure as PixelPerfect profile */}
          </section>
        )}

        {/* Verdict */}
        <section className="my-12 bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl">
          <h2 className="text-3xl font-bold mb-6">Our Verdict</h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-xl font-semibold mb-4">
              Winner: {data.verdict.winner.toUpperCase()}
            </p>
            <p>{data.verdict.summary}</p>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="bg-white p-6 rounded-lg">
                <h3>Choose PixelPerfect if:</h3>
                <ul>
                  {data.verdict.choosePP.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              </div>
              {data.verdict.chooseCompetitor && (
                <div className="bg-white p-6 rounded-lg">
                  <h3>Choose {data.competitor} if:</h3>
                  <ul>
                    {data.verdict.chooseCompetitor.map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <p className="mt-6 text-lg">{data.verdict.recommendation}</p>
          </div>
        </section>

        <FAQSection faqs={data.faq} />

        <CTASection
          title="Try PixelPerfect Free"
          description="See the difference for yourself. Start with 10 free credits."
          primaryCTA="Get Started Free"
          secondaryCTA="View Pricing"
        />
      </article>
    </PageLayout>
  );
}
```

### 2.3 Guide Page Template

```typescript
// src/components/pseo/templates/GuidePageTemplate.tsx
import type { IGuidePage } from '@/types/pseo';
import BreadcrumbNav from '@/components/pseo/ui/BreadcrumbNav';
import TableOfContents from '@/components/pseo/ui/TableOfContents';
import ReadingTime from '@/components/pseo/ui/ReadingTime';
import ShareButtons from '@/components/pseo/ui/ShareButtons';
import FAQSection from '@/components/pseo/sections/FAQSection';
import CTASection from '@/components/pseo/sections/CTASection';
import PageLayout from '@/components/pseo/utils/PageLayout';

interface IGuidePageTemplateProps {
  data: IGuidePage;
}

export default function GuidePageTemplate({ data }: IGuidePageTemplateProps) {
  return (
    <PageLayout>
      <BreadcrumbNav
        items={[
          { label: 'Home', href: '/' },
          { label: 'Guides', href: '/guides' },
          { label: data.title, href: `/guides/${data.slug}` },
        ]}
      />

      <article className="max-w-4xl mx-auto">
        {/* Article Header */}
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{data.h1}</h1>
          <div className="flex items-center gap-4 text-gray-600">
            <ReadingTime minutes={data.readTime} />
            <span>•</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {data.difficulty}
            </span>
            <span>•</span>
            <time dateTime={data.updateDate}>
              Updated {new Date(data.updateDate).toLocaleDateString()}
            </time>
          </div>
          <ShareButtons
            title={data.title}
            url={data.canonicalUrl}
            className="mt-4"
          />
        </header>

        {/* Table of Contents */}
        <TableOfContents items={data.tableOfContents} />

        {/* Introduction */}
        <div className="prose prose-lg max-w-none mb-8">
          <p className="lead text-xl">{data.introduction}</p>
        </div>

        {/* Main Content Sections */}
        {data.sections.map((section, index) => (
          <section
            key={index}
            id={`section-${index}`}
            className="mb-12 scroll-mt-20"
          >
            <h2 className="text-3xl font-bold mb-4">{section.heading}</h2>
            <div className="prose prose-lg max-w-none">
              <p>{section.content}</p>

              {/* Sub-sections */}
              {section.subSections?.map((subSection, subIndex) => (
                <div key={subIndex} className="mt-6">
                  <h3 className="text-2xl font-semibold mb-3">
                    {subSection.heading}
                  </h3>
                  <p>{subSection.content}</p>
                </div>
              ))}

              {/* Tips */}
              {section.tips && section.tips.length > 0 && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6">
                  <p className="font-semibold text-blue-900 mb-2">💡 Tips:</p>
                  <ul className="mb-0">
                    {section.tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {section.warnings && section.warnings.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6">
                  <p className="font-semibold text-yellow-900 mb-2">⚠️ Warning:</p>
                  <ul className="mb-0">
                    {section.warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Code Example */}
              {section.codeExample && (
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <code>{section.codeExample}</code>
                </pre>
              )}
            </div>
          </section>
        ))}

        {/* Conclusion */}
        <section className="my-12 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
          <h2 className="text-3xl font-bold mb-4">Conclusion</h2>
          <div className="prose prose-lg max-w-none">
            <p>{data.conclusion}</p>
          </div>
        </section>

        {/* Related Content */}
        <section className="my-12">
          <h2 className="text-2xl font-bold mb-6">Related Guides</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {data.relatedGuides.map((slug) => (
              <a
                key={slug}
                href={`/guides/${slug}`}
                className="block p-4 border rounded-lg hover:border-blue-500 hover:shadow-md transition"
              >
                {slug.replace(/-/g, ' ')}
              </a>
            ))}
          </div>
        </section>

        <FAQSection faqs={data.faq} />

        <CTASection
          title="Ready to put this into practice?"
          description="Try PixelPerfect's AI image upscaler and see the results for yourself."
          primaryCTA="Start Free Trial"
          secondaryCTA="View Demo"
        />
      </article>
    </PageLayout>
  );
}
```

---

## 3. Section Components

### 3.1 Hero Section

```typescript
// src/components/pseo/sections/HeroSection.tsx
interface IHeroSectionProps {
  h1: string;
  subtitle: string;
  primaryCTA?: string;
  secondaryCTA?: string;
  variant?: 'default' | 'comparison' | 'guide';
}

export default function HeroSection({
  h1,
  subtitle,
  primaryCTA,
  secondaryCTA,
  variant = 'default',
}: IHeroSectionProps) {
  return (
    <section className="py-12 md:py-20">
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {h1}
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-8">{subtitle}</p>

        {(primaryCTA || secondaryCTA) && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {primaryCTA && (
              <a
                href="/upscaler"
                className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                {primaryCTA}
              </a>
            )}
            {secondaryCTA && (
              <a
                href="/pricing"
                className="px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
              >
                {secondaryCTA}
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
```

### 3.2 Features Section

```typescript
// src/components/pseo/sections/FeaturesSection.tsx
import type { IFeature } from '@/types/pseo';
import FeatureCard from '@/components/pseo/ui/FeatureCard';

interface IFeaturesSectionProps {
  features: IFeature[];
  title?: string;
}

export default function FeaturesSection({
  features,
  title = 'Key Features',
}: IFeaturesSectionProps) {
  return (
    <section className="my-16">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
        {title}
      </h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <FeatureCard key={index} feature={feature} />
        ))}
      </div>
    </section>
  );
}
```

### 3.3 FAQ Section

```typescript
// src/components/pseo/sections/FAQSection.tsx
'use client';

import { useState } from 'react';
import type { IFAQ } from '@/types/pseo';
import FAQAccordion from '@/components/pseo/ui/FAQAccordion';

interface IFAQSectionProps {
  faqs: IFAQ[];
  title?: string;
}

export default function FAQSection({
  faqs,
  title = 'Frequently Asked Questions',
}: IFAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="my-16">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
        {title}
      </h2>
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
```

### 3.4 Comparison Table Section

```typescript
// src/components/pseo/sections/ComparisonTableSection.tsx
import type { IComparisonRow } from '@/types/pseo';
import ComparisonTable from '@/components/pseo/ui/ComparisonTable';

interface IComparisonTableSectionProps {
  title: string;
  rows: IComparisonRow[];
}

export default function ComparisonTableSection({
  title,
  rows,
}: IComparisonTableSectionProps) {
  return (
    <section className="my-16">
      <h2 className="text-3xl font-bold mb-8">{title}</h2>
      <ComparisonTable rows={rows} />
    </section>
  );
}
```

---

## 4. UI Components

### 4.1 Feature Card

```typescript
// src/components/pseo/ui/FeatureCard.tsx
import type { IFeature } from '@/types/pseo';
import { IconMap } from '@/lib/icons';

interface IFeatureCardProps {
  feature: IFeature;
}

export default function FeatureCard({ feature }: IFeatureCardProps) {
  const Icon = IconMap[feature.icon] || IconMap.default;

  return (
    <div className="p-6 border rounded-xl hover:shadow-lg transition group">
      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
      <p className="text-gray-600">{feature.description}</p>
    </div>
  );
}
```

### 4.2 FAQ Accordion

```typescript
// src/components/pseo/ui/FAQAccordion.tsx
'use client';

import { ChevronDown } from 'lucide-react';

interface IFAQAccordionProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

export default function FAQAccordion({
  question,
  answer,
  isOpen,
  onToggle,
}: IFAQAccordionProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition text-left"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-lg">{question}</span>
        <ChevronDown
          className={`w-5 h-5 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="p-4 bg-gray-50 border-t">
          <p className="text-gray-700 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
```

### 4.3 Comparison Table

```typescript
// src/components/pseo/ui/ComparisonTable.tsx
import type { IComparisonRow } from '@/types/pseo';
import { Check, X, Minus } from 'lucide-react';

interface IComparisonTableProps {
  rows: IComparisonRow[];
}

export default function ComparisonTable({ rows }: IComparisonTableProps) {
  const renderValue = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-green-500 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-red-500 mx-auto" />
      );
    }
    if (value === 'N/A' || value === '-') {
      return <Minus className="w-5 h-5 text-gray-400 mx-auto" />;
    }
    return value;
  };

  const getWinnerHighlight = (winner?: string, column?: 'pp' | 'competitor') => {
    if (!winner || winner === 'tie') return '';
    if (winner === 'pixelperfect' && column === 'pp') return 'bg-green-50 font-semibold';
    if (winner === 'competitor' && column === 'competitor') return 'bg-blue-50 font-semibold';
    return '';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-4 text-left font-semibold border">Feature</th>
            <th className="p-4 text-center font-semibold border">PixelPerfect</th>
            <th className="p-4 text-center font-semibold border">Competitor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="p-4 border font-medium">{row.feature}</td>
              <td className={`p-4 border text-center ${getWinnerHighlight(row.winner, 'pp')}`}>
                {renderValue(row.pixelperfect)}
              </td>
              <td className={`p-4 border text-center ${getWinnerHighlight(row.winner, 'competitor')}`}>
                {renderValue(row.competitor)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 4.4 Breadcrumb Navigation

```typescript
// src/components/pseo/ui/BreadcrumbNav.tsx
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface IBreadcrumbItem {
  label: string;
  href: string;
}

interface IBreadcrumbNavProps {
  items: IBreadcrumbItem[];
}

export default function BreadcrumbNav({ items }: IBreadcrumbNavProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-8">
      <ol className="flex items-center gap-2 text-sm">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
            {index === items.length - 1 ? (
              <span className="text-gray-600" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-blue-600 hover:underline"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

### 4.5 Table of Contents

```typescript
// src/components/pseo/ui/TableOfContents.tsx
'use client';

interface ITableOfContentsProps {
  items: string[];
}

export default function TableOfContents({ items }: ITableOfContentsProps) {
  const scrollToSection = (index: number) => {
    const element = document.getElementById(`section-${index}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="my-8 p-6 bg-gray-50 rounded-xl border">
      <h2 className="text-xl font-bold mb-4">Table of Contents</h2>
      <ol className="space-y-2">
        {items.map((item, index) => (
          <li key={index}>
            <button
              onClick={() => scrollToSection(index)}
              className="text-blue-600 hover:underline text-left"
            >
              {index + 1}. {item}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

---

## 5. Performance Optimization

### 5.1 Server vs Client Components

| Component        | Type   | Reason                           |
| ---------------- | ------ | -------------------------------- |
| ToolPageTemplate | Server | Static content, no interactivity |
| HeroSection      | Server | Static content                   |
| FeaturesSection  | Server | Static grid display              |
| FAQSection       | Client | Accordion requires state         |
| FAQAccordion     | Client | Interactive collapse/expand      |
| TableOfContents  | Client | Smooth scroll behavior           |
| ShareButtons     | Client | Browser APIs (navigator.share)   |
| ComparisonTable  | Server | Static table display             |

### 5.2 Code Splitting

```typescript
// Lazy load client components
import dynamic from 'next/dynamic';

const ShareButtons = dynamic(() => import('@/components/pseo/ui/ShareButtons'), {
  ssr: false,
  loading: () => <div className="h-10 w-32 bg-gray-200 animate-pulse rounded" />,
});

const TableOfContents = dynamic(() => import('@/components/pseo/ui/TableOfContents'), {
  loading: () => <div className="h-48 bg-gray-100 animate-pulse rounded-xl" />,
});
```

### 5.3 Image Optimization

```typescript
// All images use Next.js Image component
import Image from 'next/image';

<Image
  src={feature.image}
  alt={feature.title}
  width={800}
  height={600}
  className="rounded-lg"
  loading="lazy"
  sizes="(max-width: 768px) 100vw, 800px"
/>
```

---

## 6. Styling Guidelines

### 6.1 Tailwind Patterns

```typescript
// Consistent spacing
const SPACING = {
  section: 'my-16', // Between major sections
  subsection: 'my-8', // Between subsections
  element: 'mb-4', // Between elements
  tight: 'mb-2', // Tight spacing
};

// Consistent typography
const TYPOGRAPHY = {
  h1: 'text-4xl md:text-6xl font-bold',
  h2: 'text-3xl md:text-4xl font-bold',
  h3: 'text-2xl font-semibold',
  h4: 'text-xl font-semibold',
  body: 'text-base leading-relaxed',
  lead: 'text-xl text-gray-600',
};

// Consistent colors
const COLORS = {
  primary: 'blue-600',
  secondary: 'purple-600',
  success: 'green-600',
  warning: 'yellow-600',
  error: 'red-600',
};
```

---

## 7. Implementation Checklist

### Phase 1: Core Components

- [ ] Create template components (8 templates)
- [ ] Build section components (10 sections)
- [ ] Implement UI components (10 components)
- [ ] Set up icon library
- [ ] Configure Tailwind utilities

### Phase 2: Interactivity

- [ ] Add FAQ accordion functionality
- [ ] Implement table of contents scroll
- [ ] Add share buttons
- [ ] Create comparison table
- [ ] Build breadcrumb navigation

### Phase 3: Optimization

- [ ] Convert to Server Components where possible
- [ ] Implement code splitting
- [ ] Optimize images
- [ ] Add loading states
- [ ] Test performance

---

## Document Changelog

| Version | Date       | Author           | Changes                   |
| ------- | ---------- | ---------------- | ------------------------- |
| 1.0     | 2025-12-01 | Development Team | Initial component library |
