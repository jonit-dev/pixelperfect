import { serverEnv } from '@shared/config/env';
import type { IImageProcessor } from './image-processor.interface';
import { ReplicateService } from './replicate.service';
import { ImageGenerationService } from './image-generation.service';
import { ModelRegistry } from './model-registry';
import type { ProcessingMode } from '@shared/types/pixelperfect';
import type {
  SubscriptionTier,
  ContentType,
  IModelSelectionCriteria,
  ModelCapability,
} from './model-registry.types';

/**
 * Factory for creating image processor instances
 *
 * Design Pattern: Factory + Strategy
 * - Factory: Creates the appropriate provider instance based on model registry
 * - Strategy: Providers implement common IImageProcessor interface
 * - Registry: Models configured via environment variables with tier restrictions
 *
 * Provider Selection Logic (Multi-Model Architecture):
 * 1. **Model Registry** - Selects best model based on user tier, capabilities, and preferences
 * 2. **Provider Routing** - Routes to Replicate, Gemini, or other providers based on model config
 * 3. **Free Tier Handling** - Manages Google free tier with automatic fallback to Replicate
 *
 * Backward Compatibility:
 * - Maintains existing createProcessor API for simple use cases
 * - Adds new methods for advanced model selection
 * - Falls back to legacy behavior when model ID not specified
 */
export class ImageProcessorFactory {
  private static replicateInstance: ReplicateService | null = null;
  private static geminiInstance: ImageGenerationService | null = null;
  private static modelRegistry: ModelRegistry | null = null;

  /**
   * Get or create a Replicate service instance (singleton)
   */
  private static getReplicateService(): ReplicateService {
    if (!this.replicateInstance) {
      this.replicateInstance = new ReplicateService();
    }
    return this.replicateInstance;
  }

  /**
   * Get or create a Gemini service instance (singleton)
   */
  private static getGeminiService(): ImageGenerationService {
    if (!this.geminiInstance) {
      this.geminiInstance = new ImageGenerationService();
    }
    return this.geminiInstance;
  }

  /**
   * Get or create the model registry instance (singleton)
   */
  private static getModelRegistry(): ModelRegistry {
    if (!this.modelRegistry) {
      this.modelRegistry = ModelRegistry.getInstance();
    }
    return this.modelRegistry;
  }

  /**
   * Create processor for a specific model from the registry
   *
   * @param modelId - The model ID from the registry
   * @returns An image processor instance configured for the model
   */
  static createProcessorForModel(modelId: string): IImageProcessor {
    const registry = this.getModelRegistry();
    const model = registry.getModel(modelId);

    if (!model || !model.isEnabled) {
      throw new Error(`Model ${modelId} is not available or not enabled`);
    }

    // Get provider (handles Google free tier fallback)
    const { provider, useFallback } = registry.getProviderForModel(modelId);

    if (useFallback) {
      console.warn(`Using fallback provider for model ${modelId}`);
    }

    // Return appropriate processor
    switch (provider) {
      case 'replicate':
        return this.getReplicateService();
      case 'gemini':
        return this.getGeminiService();
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Create processor based on model selection criteria
   *
   * @param criteria - Model selection criteria
   * @returns An image processor instance for the best matching model
   */
  static createProcessorForCriteria(criteria: {
    userTier: SubscriptionTier;
    mode: ProcessingMode;
    scale: 2 | 4 | 8;
    requiredCapabilities?: string[];
    preferences?: {
      preserveText?: boolean;
      enhanceFaces?: boolean;
      denoise?: boolean;
      prioritizeQuality?: boolean;
    };
    availableCredits?: number;
  }): IImageProcessor {
    const registry = this.getModelRegistry();

    // Convert to proper criteria format
    const modelCriteria: IModelSelectionCriteria = {
      userTier: criteria.userTier,
      mode: criteria.mode as 'upscale' | 'enhance' | 'both' | 'custom',
      scale: criteria.scale,
      requiredCapabilities: (criteria.requiredCapabilities || []) as ModelCapability[],
      preferences: {
        enhanceFaces: criteria.preferences?.enhanceFaces || false,
        denoise: criteria.preferences?.denoise || false,
        prioritizeQuality: criteria.preferences?.prioritizeQuality || false,
      },
      availableCredits: criteria.availableCredits || 999,
    };

    // Select best model
    const model = registry.selectBestModel(modelCriteria);

    if (!model) {
      // Fallback to legacy behavior
      console.warn('No suitable model found, falling back to legacy processor selection');
      return this.createProcessor(criteria.mode);
    }

    return this.createProcessorForModel(model.id);
  }

  /**
   * Legacy method for backward compatibility
   *
   * @param mode - The processing mode
   * @returns An image processor instance
   * @throws Error if no suitable provider is available
   */
  static createProcessor(mode: ProcessingMode): IImageProcessor {
    // Try to use model registry with default model
    const registry = this.getModelRegistry();
    const defaultModel = registry.getModel('real-esrgan-standard');

    if (defaultModel && defaultModel.isEnabled) {
      return this.createProcessorForModel(defaultModel.id);
    }

    // Fallback to legacy behavior
    // Try Replicate first for upscale/both modes (default, fast, cheap)
    if (['upscale', 'both'].includes(mode) && serverEnv.REPLICATE_API_TOKEN) {
      try {
        return this.getReplicateService();
      } catch (error) {
        console.warn('Replicate unavailable, falling back to Gemini:', error);
        // Fall through to Gemini
      }
    }

    // Use Gemini for enhance/custom modes or as fallback
    if (serverEnv.GEMINI_API_KEY) {
      return this.getGeminiService();
    }

    // No providers available
    throw new Error(
      'No image processing providers configured. Set REPLICATE_API_TOKEN or GEMINI_API_KEY.'
    );
  }

  /**
   * Get the best available processor with automatic fallback
   *
   * This method attempts to use the most cost-effective provider
   * and gracefully falls back if unavailable.
   *
   * @param mode - The processing mode
   * @returns An image processor instance with fallback capability
   */
  static createProcessorWithFallback(mode: ProcessingMode): {
    primary: IImageProcessor;
    fallback: IImageProcessor | null;
  } {
    let primary: IImageProcessor;
    let fallback: IImageProcessor | null = null;

    // For upscale/both: try Replicate first, Gemini as fallback
    if (['upscale', 'both'].includes(mode)) {
      if (serverEnv.REPLICATE_API_TOKEN) {
        try {
          primary = this.getReplicateService();
          // Set Gemini as fallback if available
          if (serverEnv.GEMINI_API_KEY) {
            fallback = this.getGeminiService();
          }
          return { primary, fallback };
        } catch (error) {
          console.warn('Replicate initialization failed:', error);
          // Fall through to Gemini
        }
      }
    }

    // For enhance/custom or fallback: use Gemini
    if (serverEnv.GEMINI_API_KEY) {
      primary = this.getGeminiService();
      return { primary, fallback: null }; // No fallback for Gemini
    }

    throw new Error('No image processing providers available');
  }

  /**
   * Check if a specific provider is available
   */
  static isProviderAvailable(providerName: 'Replicate' | 'Gemini'): boolean {
    switch (providerName) {
      case 'Replicate':
        return Boolean(serverEnv.REPLICATE_API_TOKEN);
      case 'Gemini':
        return Boolean(serverEnv.GEMINI_API_KEY);
      default:
        return false;
    }
  }

  /**
   * Get information about available providers
   */
  static getAvailableProviders(): Array<{ name: string; available: boolean; modes: string[] }> {
    return [
      {
        name: 'Replicate',
        available: this.isProviderAvailable('Replicate'),
        modes: ['upscale', 'both'],
      },
      {
        name: 'Gemini',
        available: this.isProviderAvailable('Gemini'),
        modes: ['upscale', 'enhance', 'both', 'custom'],
      },
    ];
  }

  /**
   * Get available models for a user tier
   */
  static getAvailableModels(userTier: SubscriptionTier): Array<{
    id: string;
    displayName: string;
    provider: string;
    creditMultiplier: number;
    qualityScore: number;
    capabilities: string[];
    supportedScales: number[];
    isEnabled: boolean;
  }> {
    const registry = this.getModelRegistry();
    return registry.getModelsByTier(userTier).map(model => ({
      id: model.id,
      displayName: model.displayName,
      provider: model.provider,
      creditMultiplier: model.creditMultiplier,
      qualityScore: model.qualityScore,
      capabilities: model.capabilities,
      supportedScales: model.supportedScales,
      isEnabled: model.isEnabled,
    }));
  }

  /**
   * Calculate credit cost for a model
   */
  static calculateCreditCost(modelId: string, scale: 2 | 4 | 8, mode: ProcessingMode): number {
    const registry = this.getModelRegistry();
    // Use the new method that handles custom mode
    return registry.calculateCreditCostWithMode(modelId, scale, mode);
  }

  /**
   * Get model recommendation for auto mode
   */
  static getModelRecommendation(
    analysis: {
      damageLevel?: number;
      faceCount?: number;
      textCoverage?: number;
      contentType?: string;
    },
    userTier: SubscriptionTier,
    mode: ProcessingMode,
    scale: 2 | 4 | 8
  ): {
    recommendedModel: string;
    reasoning: string;
    creditCost: number;
    alternatives: string[];
  } {
    const registry = this.getModelRegistry();
    // Convert string contentType to proper ContentType if needed
    const analysisForRegistry = {
      ...analysis,
      contentType: analysis.contentType as ContentType | undefined,
    };
    // Convert 'custom' to 'enhance' for recommendation
    const modeForRecommendation =
      mode === 'custom' ? 'enhance' : (mode as 'upscale' | 'enhance' | 'both');
    return registry.recommendModel(analysisForRegistry, userTier, modeForRecommendation, scale);
  }
}
