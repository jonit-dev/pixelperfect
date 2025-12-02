/**
 * SEO Module - Programmatic SEO Infrastructure
 * Centralized exports for keyword management, mapping, and tracking
 */

// Types
export type {
  IKeyword,
  IKeywordTier,
  IKeywordIntent,
  IKeywordPageMapping,
  IPageTemplate,
} from './types';

// Keyword Mappings
export {
  keywordPageMappings,
  getPageMappingByUrl,
  getPageMappingByKeyword,
  getPagesByCategory,
  getP0Pages,
  getPagesByTier,
} from './keyword-mappings';

// Keyword Tiers
export { keywordTiers, getTierByVolume, getTierInfo } from './keyword-tiers';

// Tracking
export {
  KeywordTracker,
  reviewCadence,
  type IKeywordTracking,
  type IKeywordPerformance,
  type IReviewTask,
} from './tracking';
