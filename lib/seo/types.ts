/**
 * SEO Keyword Types
 * Data structures for programmatic SEO keyword management
 */

export interface IKeyword {
  keyword: string;
  currency: string;
  avgMonthlySearches: number;
  threeMonthChange: string;
  yoyChange: string;
  competition: 'Low' | 'Medium' | 'High';
  competitionIndex: number;
  bidLowRange: number;
  bidHighRange: number;
}

export interface IKeywordTier {
  tier: 1 | 2 | 3 | 4 | 5;
  name: 'Critical' | 'High' | 'Medium' | 'Long-tail' | 'Ultra-tail';
  volumeMin: number;
  volumeMax: number | null;
  minWordCount: number;
}

export interface IKeywordIntent {
  type: 'Transactional' | 'Comparison' | 'Informational' | 'Commercial' | 'Navigational';
  description: string;
  targetPageTypes: string[];
}

export interface IKeywordPageMapping {
  primaryKeyword: string;
  secondaryKeywords: string[];
  canonicalUrl: string;
  intent: IKeywordIntent['type'];
  tier: IKeywordTier['tier'];
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  contentRequirements: {
    minWords: number;
    sections: string[];
    faqCount: number;
    internalLinks: number;
  };
}

export interface IPageTemplate {
  url: string;
  category:
    | 'tools'
    | 'formats'
    | 'scale'
    | 'use-cases'
    | 'compare'
    | 'alternatives'
    | 'guides'
    | 'free';
  primaryKeyword: string;
  secondaryKeywords: string[];
  tier: IKeywordTier['tier'];
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  status: 'draft' | 'in-progress' | 'published' | 'optimizing';
}
