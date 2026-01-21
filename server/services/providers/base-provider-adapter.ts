/**
 * Base Provider Adapter
 *
 * Abstract base class for provider adapters that wraps IImageProcessor
 * with credit tracking and usage monitoring.
 */

import type {
  IImageProcessor,
  IProcessImageOptions,
  IImageProcessorResult,
  IUpscaleInput,
} from '@shared/types/provider-adapter.types';
import type {
  IProviderAdapter,
  IProviderConfig,
  IProviderUsage,
} from '@shared/types/provider-adapter.types';
import { getProviderCreditTracker } from '../provider-credit-tracker.service';

/**
 * Abstract base class for provider adapters
 */
export abstract class BaseProviderAdapter implements IProviderAdapter {
  protected processor: IImageProcessor;
  protected config: IProviderConfig;
  protected creditTracker = getProviderCreditTracker();

  constructor(processor: IImageProcessor, config: IProviderConfig) {
    this.processor = processor;
    this.config = config;
  }

  /**
   * Process image with automatic credit tracking and error handling
   */
  async processImage(
    userId: string,
    input: IUpscaleInput,
    options?: IProcessImageOptions
  ): Promise<IImageProcessorResult> {
    // Check if provider is available before processing
    const isAvailable = await this.isAvailable();
    if (!isAvailable) {
      throw new Error(
        `Provider ${this.config.provider} is not available (free tier limit reached). Please try again later or upgrade.`
      );
    }

    try {
      // Process the image
      const result = await this.processor.processImage(userId, input, options);

      // Increment usage tracking (1 request, credit cost based on model)
      const creditCost = this.calculateCreditCost(options);
      await this.creditTracker.incrementUsage(this.config.provider, 1, creditCost);

      // Log usage for monitoring
      this.creditTracker.logProviderUsage(this.config.provider);

      return result;
    } catch (error) {
      // Log error and rethrow
      console.error(`Provider ${this.config.provider} error:`, error);
      throw error;
    }
  }

  /**
   * Get provider configuration
   */
  getConfig(): IProviderConfig {
    return { ...this.config };
  }

  /**
   * Get current provider usage statistics
   */
  async getUsage(): Promise<IProviderUsage> {
    return (await this.creditTracker.getProviderUsage(this.config.provider)) as IProviderUsage;
  }

  /**
   * Check if provider is available (within free tier limits)
   */
  async isAvailable(): Promise<boolean> {
    return await this.creditTracker.isProviderAvailable(this.config.provider);
  }

  /**
   * Reset daily/monthly counters
   */
  async resetCounters(period: 'daily' | 'monthly'): Promise<void> {
    if (period === 'daily') {
      await this.creditTracker.resetDailyCounters(this.config.provider);
    } else {
      await this.creditTracker.resetMonthlyCounters(this.config.provider);
    }
  }

  /**
   * Get underlying processor
   */
  getProcessor(): IImageProcessor {
    return this.processor;
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return this.processor.providerName;
  }

  /**
   * Calculate credit cost for a processing request
   * Can be overridden by specific adapters
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected calculateCreditCost(options?: IProcessImageOptions): number {
    // Base cost + model multipliers
    // This should align with the credit system in the project
    return 1; // Default: 1 credit per request
  }

  /**
   * Check if this adapter supports a specific mode
   */
  supportsMode(mode: string): boolean {
    return this.processor.supportsMode(mode);
  }
}
