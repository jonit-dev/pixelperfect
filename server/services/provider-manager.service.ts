/**
 * Provider Manager
 *
 * Manages multiple AI provider adapters with automatic provider selection
 * and fallback logic based on free tier limits and availability.
 */

import type {
  IProviderAdapter,
  IProviderManager,
  IProviderSelectionContext,
  IProviderConfig,
  IProviderUsage,
} from '@shared/types/provider-adapter.types';
import { AIProvider } from '@shared/types/provider-adapter.types';
import type {
  IImageProcessorResult,
  IProcessImageOptions,
} from '@server/services/image-processor.interface';
import type { IUpscaleInput } from '@shared/validation/upscale.schema';
import { getProviderCreditTracker } from './provider-credit-tracker.service';

/**
 * Provider Manager Implementation
 *
 * Automatically selects the best available provider based on:
 * 1. Free tier availability (prioritize free providers)
 * 2. Model compatibility
 * 3. Subscription tier (could be extended)
 * 4. Provider priority (configured)
 * 5. Fallback chain
 */
export class ProviderManager implements IProviderManager {
  private adapters: Map<AIProvider, IProviderAdapter> = new Map();
  private creditTracker = getProviderCreditTracker();

  constructor() {
    this.initializeDefaultAdapters();
  }

  /**
   * Initialize default provider adapters
   */
  private initializeDefaultAdapters(): void {
    // Note: Adapters will be registered by the factory
    // This is a placeholder for any adapter initialization logic
  }

  /**
   * Register a provider adapter
   */
  registerProvider(adapter: IProviderAdapter): void {
    const provider = adapter.getProviderName() as AIProvider;
    this.adapters.set(provider, adapter);
    console.log(`[ProviderManager] Registered provider: ${provider}`);
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): IProviderAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get provider by name
   */
  getProviderByType(provider: AIProvider): IProviderAdapter | undefined {
    return this.adapters.get(provider);
  }

  /**
   * Update provider configuration
   */
  updateProviderConfig(provider: AIProvider, config: Partial<IProviderConfig>): void {
    const adapter = this.adapters.get(provider);
    if (adapter) {
      // Config update would need to be implemented in the adapter
      console.log(`[ProviderManager] Config updated for ${provider}:`, config);
    }
  }

  /**
   * Select the best available provider for a given context
   *
   * Selection logic:
   * 1. Try free tier providers first (Gemini)
   * 2. Check if within free tier limits
   * 3. Fall back to paid providers (Replicate)
   * 4. Use priority and fallback chains
   */
  async getProvider(context: IProviderSelectionContext): Promise<IProviderAdapter> {
    const { requestedModel, useCase } = context;

    // Get all enabled providers sorted by priority
    const availableProviders = this.getAllProviders()
      .filter(adapter => adapter.getConfig().enabled)
      .sort((a, b) => a.getConfig().priority - b.getConfig().priority);

    console.log(`[ProviderManager] Selecting provider for context:`, {
      requestedModel,
      useCase,
      availableProviders: availableProviders.map(p => ({
        provider: p.getConfig().provider,
        priority: p.getConfig().priority,
        tier: p.getConfig().tier,
      })),
    });

    // Try each provider in priority order
    for (const adapter of availableProviders) {
      const config = adapter.getConfig();
      const isAvailable = await adapter.isAvailable();

      if (!isAvailable) {
        console.log(`[ProviderManager] ${config.provider} not available, checking next...`);
        continue;
      }

      // Check if provider supports the requested model/use case
      const supportsModel = !requestedModel || config.supportedModels.includes(requestedModel);
      if (!supportsModel) {
        console.log(`[ProviderManager] ${config.provider} doesn't support model ${requestedModel}`);
        continue;
      }

      console.log(`[ProviderManager] Selected provider: ${config.provider}`);
      return adapter;
    }

    // If no provider is available, throw error
    throw new Error('No AI providers available. Please try again later.');
  }

  /**
   * Process image with automatic provider selection and fallback
   */
  async processImage(
    userId: string,
    input: IUpscaleInput,
    options?: IProcessImageOptions
  ): Promise<IImageProcessorResult> {
    const context: IProviderSelectionContext = {
      userId,
      // Use quality tier as the model hint for provider selection
      requestedModel: input.config?.qualityTier,
    };

    // Get best available provider
    const adapter = await this.getProvider(context);
    const provider = adapter.getConfig().provider;

    console.log(`[ProviderManager] Processing with provider: ${provider}`);

    try {
      // Try to process with selected provider
      return await adapter.processImage(userId, input, options);
    } catch (error) {
      console.error(`[ProviderManager] Error with ${provider}:`, error);

      // Try fallback provider if available
      const config = adapter.getConfig();
      if (config.fallbackProvider) {
        const fallbackAdapter = this.getProviderByType(config.fallbackProvider);
        if (fallbackAdapter) {
          console.log(`[ProviderManager] Falling back to ${config.fallbackProvider}`);
          return await fallbackAdapter.processImage(userId, input, options);
        }
      }

      // Re-throw original error if no fallback
      throw error;
    }
  }

  /**
   * Get provider usage statistics for monitoring
   */
  async getProvidersUsage(): Promise<Record<AIProvider, IProviderUsage>> {
    return await this.creditTracker.getAllProvidersUsage();
  }

  /**
   * Log all provider usage for debugging
   */
  logAllProvidersUsage(): void {
    this.creditTracker.getAllProvidersUsage().then(usage => {
      console.log('[ProviderManager] All Providers Usage:');
      Object.entries(usage).forEach(([provider, stats]) => {
        const limits = this.creditTracker.getProviderLimits(provider as AIProvider);
        console.log(`  ${provider}:`, {
          daily: `${stats.todayRequests}/${limits.dailyRequests || '∞'}`,
          monthly: `${stats.monthCredits}/${limits.monthlyCredits || '∞'}`,
        });
      });
    });
  }
}

// Singleton instance
let managerInstance: ProviderManager | null = null;

export function getProviderManager(): ProviderManager {
  if (!managerInstance) {
    managerInstance = new ProviderManager();
  }
  return managerInstance;
}
