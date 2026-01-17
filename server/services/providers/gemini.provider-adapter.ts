/**
 * Gemini Provider Adapter
 *
 * Adapter for Google Gemini AI provider with free tier tracking and usage monitoring.
 */

import type { IImageProcessor } from '@server/services/image-processor.interface';
import type { IProviderConfig } from '@shared/types/provider-adapter.types';
import { AIProvider, ProviderTier } from '@shared/types/provider-adapter.types';
import { BaseProviderAdapter } from './base-provider-adapter';

/**
 * Gemini provider configuration
 * Free tier: 500 requests per day
 */
const GEMINI_CONFIG: IProviderConfig = {
  provider: AIProvider.GEMINI,
  tier: ProviderTier.FREE, // Has generous free tier
  priority: 1, // Higher priority (use free tier first)
  enabled: true,
  supportedModels: ['nano-banana', 'nano-banana-pro'], // Text-preserving models
  fallbackProvider: AIProvider.REPLICATE, // Fall back to Replicate if limits hit
  freeTier: {
    dailyRequests: 500, // 500 free requests per day
    monthlyCredits: 15000, // ~500/day * 30 days
    hardLimit: true, // Hard limit - reject when exceeded
    resetTimezone: 'UTC',
  },
};

/**
 * Adapter for Google Gemini AI provider
 */
export class GeminiProviderAdapter extends BaseProviderAdapter {
  constructor(processor: IImageProcessor) {
    super(processor, GEMINI_CONFIG);
  }

  /**
   * Calculate credit cost for Gemini
   * Gemini is more cost-effective for text-preserving upscaling
   */
  protected override calculateCreditCost(): number {
    // Gemini has flat pricing per request
    return 1; // 1 credit per request regardless of model
  }

  /**
   * Check if Gemini is available (within free tier limits)
   */
  override async isAvailable(): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    // Check if we're within free tier limits
    return await super.isAvailable();
  }

  /**
   * Get remaining free tier requests for today
   */
  async getRemainingFreeRequests(): Promise<number> {
    const usage = await this.getUsage();
    const limits = this.config.freeTier!;

    return Math.max(0, limits.dailyRequests - usage.todayRequests);
  }
}

/**
 * Factory function to create Gemini adapter
 */
export function createGeminiAdapter(processor: IImageProcessor): GeminiProviderAdapter {
  return new GeminiProviderAdapter(processor);
}
