/**
 * Keyword Tier Definitions
 * Based on PRD-PSEO-01 Section 2.1: Volume Tiers
 */

import { IKeywordTier } from './types';

export const keywordTiers: IKeywordTier[] = [
  {
    tier: 1,
    name: 'Critical',
    volumeMin: 500000,
    volumeMax: null,
    minWordCount: 2250,
  },
  {
    tier: 2,
    name: 'High',
    volumeMin: 50000,
    volumeMax: 499999,
    minWordCount: 1400,
  },
  {
    tier: 3,
    name: 'Medium',
    volumeMin: 5000,
    volumeMax: 49999,
    minWordCount: 850,
  },
  {
    tier: 4,
    name: 'Long-tail',
    volumeMin: 500,
    volumeMax: 4999,
    minWordCount: 600,
  },
  {
    tier: 5,
    name: 'Ultra-tail',
    volumeMin: 0,
    volumeMax: 499,
    minWordCount: 400,
  },
];

/**
 * Get tier based on monthly search volume
 */
export function getTierByVolume(monthlySearches: number): IKeywordTier {
  for (const tier of keywordTiers) {
    if (tier.volumeMax === null && monthlySearches >= tier.volumeMin) {
      return tier;
    }
    if (monthlySearches >= tier.volumeMin && tier.volumeMax && monthlySearches <= tier.volumeMax) {
      return tier;
    }
  }
  // Default to ultra-tail
  return keywordTiers[4];
}

/**
 * Get tier information by tier number
 */
export function getTierInfo(tierNumber: 1 | 2 | 3 | 4 | 5): IKeywordTier {
  return keywordTiers[tierNumber - 1];
}
