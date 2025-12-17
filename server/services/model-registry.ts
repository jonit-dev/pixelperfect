import { serverEnv } from '@shared/config/env';
import type {
  IModelConfig,
  ModelCapability,
  ContentType,
  SubscriptionTier,
  IModelSelectionCriteria,
  IModelRecommendation,
  ModelProvider,
} from './model-registry.types';

/**
 * Default model versions - used when no override is provided
 *
 * Models:
 * - real-esrgan: Default upscale (fast, reliable)
 * - gfpgan: Face restore / old photos
 * - nano-banana: Text/logo preservation (Google Gemini free tier)
 * - clarity-upscaler: Upscale Plus (higher quality)
 * - nano-banana-pro: Upscale Ultra (premium, heavy damage repair)
 */
const DEFAULT_MODEL_VERSIONS: Record<string, string> = {
  'real-esrgan': 'nightmareai/real-esrgan',
  gfpgan: 'tencentarc/gfpgan:0fbacf7afc6c144e5be9767cff80f25aff23e52b0708f17e20f9879b2f21516c',
  'nano-banana': 'gemini-2.5-flash-image',
  'clarity-upscaler':
    'philz1337x/clarity-upscaler:dfad41707589d68ecdccd1dfa600d55a208f9310748e44bfe35b4a6291453d5e',
  'nano-banana-pro': 'google/nano-banana-pro',
};

/**
 * Model costs per run (USD) - rarely change, kept in code
 */
const MODEL_COSTS: Record<string, number> = {
  'real-esrgan': 0.0017,
  gfpgan: 0.0025,
  'nano-banana': 0.0, // Google Gemini free tier (500 req/day)
  'clarity-upscaler': 0.017,
  'nano-banana-pro': 0.13,
};

/**
 * Model credit multipliers - tied to model economics
 */
const MODEL_CREDIT_MULTIPLIERS: Record<string, number> = {
  'real-esrgan': 1,
  gfpgan: 2,
  'nano-banana': 2,
  'clarity-upscaler': 4,
  'nano-banana-pro': 8,
};

/**
 * Model Registry Service
 *
 * Manages model configurations, selection logic, and credit cost calculations
 * for the multi-model architecture system.
 *
 * Features:
 * - Use-case based model assignment via env vars
 * - Feature flags for quick toggles
 * - Tier restriction validation
 * - Credit cost calculation
 * - Model recommendation engine
 */
export class ModelRegistry {
  private static instance: ModelRegistry | null = null;
  private models: Map<string, IModelConfig> = new Map();
  private useCaseAssignments: Record<string, string> = {};

  private constructor() {
    this.loadModelsFromEnvironment();
    this.loadUseCaseAssignments();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ModelRegistry {
    if (!this.instance) {
      this.instance = new ModelRegistry();
    }
    return this.instance;
  }

  /**
   * Get model version - use override if provided, otherwise default
   */
  private getModelVersion(modelId: string): string {
    const overrides: Record<string, string | undefined> = {
      'real-esrgan': serverEnv.MODEL_VERSION_REAL_ESRGAN,
      gfpgan: serverEnv.MODEL_VERSION_GFPGAN,
      'nano-banana': serverEnv.MODEL_VERSION_NANO_BANANA,
      'clarity-upscaler': serverEnv.MODEL_VERSION_CLARITY_UPSCALER,
      'nano-banana-pro': serverEnv.MODEL_VERSION_NANO_BANANA_PRO,
    };
    return overrides[modelId] || DEFAULT_MODEL_VERSIONS[modelId];
  }

  /**
   * Load model configurations
   * Costs and credits are defined in code constants (rarely change)
   * Versions can be overridden via env vars
   */
  private loadModelsFromEnvironment(): void {
    const modelConfigs: IModelConfig[] = [
      // Real-ESRGAN (Default Upscale)
      {
        id: 'real-esrgan',
        displayName: 'Upscale',
        provider: 'replicate',
        modelVersion: this.getModelVersion('real-esrgan'),
        capabilities: ['upscale', 'denoise'],
        costPerRun: MODEL_COSTS['real-esrgan'],
        creditMultiplier: MODEL_CREDIT_MULTIPLIERS['real-esrgan'],
        qualityScore: 8.5,
        processingTimeMs: 2000,
        maxInputResolution: 2048 * 2048,
        maxOutputResolution: 4096 * 4096,
        supportedScales: [2, 4], // Real-ESRGAN only supports 2x and 4x
        isEnabled: true, // Always enabled as fallback
      },
      // GFPGAN (Face Restore / Old Photos)
      {
        id: 'gfpgan',
        displayName: 'Face Restore',
        provider: 'replicate',
        modelVersion: this.getModelVersion('gfpgan'),
        capabilities: ['upscale', 'face-restoration', 'denoise', 'damage-repair'],
        costPerRun: MODEL_COSTS['gfpgan'],
        creditMultiplier: MODEL_CREDIT_MULTIPLIERS['gfpgan'],
        qualityScore: 9.0,
        processingTimeMs: 5000,
        maxInputResolution: 2048 * 2048,
        maxOutputResolution: 4096 * 4096,
        supportedScales: [2, 4], // GFPGAN max scale is 4
        isEnabled: true,
      },
      // Nano Banana (Text/Logo Preservation)
      {
        id: 'nano-banana',
        displayName: 'Text Preserve',
        provider: 'gemini',
        modelVersion: this.getModelVersion('nano-banana'),
        capabilities: ['upscale', 'text-preservation', 'enhance'],
        costPerRun: MODEL_COSTS['nano-banana'],
        creditMultiplier: MODEL_CREDIT_MULTIPLIERS['nano-banana'],
        qualityScore: 8.0,
        processingTimeMs: 3000,
        maxInputResolution: 2048 * 2048,
        maxOutputResolution: 4096 * 4096,
        supportedScales: [2, 4, 8],
        isEnabled: true,
      },
      // Clarity Upscaler (Upscale Plus)
      {
        id: 'clarity-upscaler',
        displayName: 'Upscale Plus',
        provider: 'replicate',
        modelVersion: this.getModelVersion('clarity-upscaler'),
        capabilities: ['upscale', 'denoise', 'enhance'],
        costPerRun: MODEL_COSTS['clarity-upscaler'],
        creditMultiplier: MODEL_CREDIT_MULTIPLIERS['clarity-upscaler'],
        qualityScore: 9.5,
        processingTimeMs: 15000,
        maxInputResolution: 2048 * 2048,
        maxOutputResolution: 4096 * 4096,
        supportedScales: [2, 4, 8],
        isEnabled: serverEnv.ENABLE_PREMIUM_MODELS,
      },
      // Nano Banana Pro (Upscale Ultra - Premium)
      {
        id: 'nano-banana-pro',
        displayName: 'Upscale Ultra',
        provider: 'replicate',
        modelVersion: this.getModelVersion('nano-banana-pro'),
        capabilities: [
          'upscale',
          'enhance',
          'face-restoration',
          'denoise',
          'damage-repair',
          '4k-output',
          '8k-output',
        ],
        costPerRun: MODEL_COSTS['nano-banana-pro'],
        creditMultiplier: MODEL_CREDIT_MULTIPLIERS['nano-banana-pro'],
        qualityScore: 9.8,
        processingTimeMs: 30000,
        maxInputResolution: 2048 * 2048,
        maxOutputResolution: 8192 * 8192,
        supportedScales: [2, 4, 8],
        isEnabled: serverEnv.ENABLE_PREMIUM_MODELS,
        tierRestriction: 'hobby',
      },
    ];

    this.models.clear();
    modelConfigs.forEach(config => {
      this.models.set(config.id, config);
    });
  }

  /**
   * Load use-case to model assignments from env
   */
  private loadUseCaseAssignments(): void {
    this.useCaseAssignments = {
      generalUpscale: serverEnv.MODEL_FOR_GENERAL_UPSCALE,
      portraits: serverEnv.MODEL_FOR_PORTRAITS,
      damagedPhotos: serverEnv.MODEL_FOR_DAMAGED_PHOTOS,
      textLogos: serverEnv.MODEL_FOR_TEXT_LOGOS,
      maxQuality: serverEnv.MODEL_FOR_MAX_QUALITY,
    };
  }

  /**
   * Get model for a specific use case
   */
  getModelForUseCase(
    useCase: 'generalUpscale' | 'portraits' | 'damagedPhotos' | 'textLogos' | 'maxQuality'
  ): IModelConfig | null {
    const modelId = this.useCaseAssignments[useCase];
    return this.getModel(modelId);
  }

  /**
   * Check if auto model selection is enabled
   */
  isAutoSelectionEnabled(): boolean {
    return serverEnv.ENABLE_AUTO_MODEL_SELECTION;
  }

  /**
   * Get all enabled models
   */
  getEnabledModels(): IModelConfig[] {
    return Array.from(this.models.values()).filter(model => model.isEnabled);
  }

  /**
   * Get models by capability
   */
  getModelsByCapability(capability: ModelCapability): IModelConfig[] {
    return this.getEnabledModels().filter(model => model.capabilities.includes(capability));
  }

  /**
   * Get models available for a subscription tier
   */
  getModelsByTier(tier: SubscriptionTier): IModelConfig[] {
    return this.getEnabledModels().filter(model => {
      if (!model.tierRestriction) return true;

      // Tier hierarchy: business > pro > hobby > free
      const tierLevels = { free: 0, hobby: 1, pro: 2, business: 3 };
      const modelLevel = tierLevels[model.tierRestriction.toLowerCase() as SubscriptionTier];
      const userLevel = tierLevels[tier.toLowerCase() as SubscriptionTier];

      return userLevel >= modelLevel;
    });
  }

  /**
   * Get a specific model by ID
   */
  getModel(modelId: string): IModelConfig | null {
    return this.models.get(modelId) || null;
  }

  /**
   * Calculate credit cost for a model
   * Credit cost is based only on mode and model - scale does not affect credits
   */
  calculateCreditCost(
    modelId: string,
    _scale: 2 | 4 | 8,
    mode: 'upscale' | 'enhance' | 'both'
  ): number {
    const model = this.getModel(modelId);
    if (!model) return 0;

    // Base credits: 1 for upscale, 2 for enhance/both
    const baseCredits = mode === 'upscale' ? 1 : 2;

    // Final calculation: only base credits × model multiplier
    return Math.ceil(baseCredits * model.creditMultiplier);
  }

  /**
   * Calculate credit cost for a model with scale multiplier (including custom mode)
   */
  calculateCreditCostWithMode(
    modelId: string,
    scale: 2 | 4 | 8,
    mode: 'upscale' | 'enhance' | 'both' | 'custom'
  ): number {
    // Treat 'custom' as 'enhance' for pricing
    const modeForCalc = mode === 'custom' ? 'enhance' : mode;
    return this.calculateCreditCost(modelId, scale, modeForCalc);
  }

  /**
   * Get best model based on criteria
   */
  selectBestModel(criteria: IModelSelectionCriteria): IModelConfig | null {
    // Filter by tier and enabled status
    let candidates = this.getModelsByTier(criteria.userTier);

    // Filter by required capabilities
    candidates = candidates.filter(model =>
      criteria.requiredCapabilities.every(cap => model.capabilities.includes(cap))
    );

    // Filter by scale support
    candidates = candidates.filter(model => model.supportedScales.includes(criteria.scale));

    // Apply user preferences
    if (criteria.preferences.enhanceFaces) {
      // Prefer models with face restoration
      const faceModels = candidates.filter(m => m.capabilities.includes('face-restoration'));
      if (faceModels.length > 0) {
        candidates = faceModels;
      }
    }

    if (criteria.preferences.prioritizeQuality) {
      // Sort by quality score (descending)
      candidates.sort((a, b) => b.qualityScore - a.qualityScore);
    } else {
      // Sort by cost (ascending) for speed
      candidates.sort((a, b) => a.costPerRun - b.costPerRun);
    }

    // Check if user has enough credits for the best model
    for (const model of candidates) {
      const cost = this.calculateCreditCostWithMode(model.id, criteria.scale, criteria.mode);
      if (criteria.availableCredits >= cost) {
        return model;
      }
    }

    // Return cheapest model if none affordable
    return candidates[0] || null;
  }

  /**
   * Get model recommendation based on image analysis (auto mode)
   * Uses use-case assignments from env vars for model selection
   */
  recommendModel(
    analysis: {
      damageLevel?: number;
      faceCount?: number;
      textCoverage?: number;
      noiseLevel?: number;
      contentType?: ContentType;
    },
    userTier: SubscriptionTier,
    mode: 'upscale' | 'enhance' | 'both',
    scale: 2 | 4 | 8
  ): IModelRecommendation {
    // Get eligible models for the user's tier
    const eligibleModels = this.getModelsByTier(userTier).filter(m =>
      m.supportedScales.includes(scale)
    );

    // Default to general upscale model
    let recommended = this.useCaseAssignments.generalUpscale;
    let reasoning = 'Standard upscaling selected.';

    // Apply rule-based recommendation using use-case assignments
    if (analysis.damageLevel && analysis.damageLevel > 0.7) {
      const damageModel = this.useCaseAssignments.damagedPhotos;
      if (eligibleModels.some(m => m.id === damageModel)) {
        recommended = damageModel;
        reasoning = 'Heavy damage detected. Premium restoration recommended.';
      }
    } else if (
      (analysis.textCoverage && analysis.textCoverage > 0.15) ||
      analysis.contentType === 'document'
    ) {
      const textModel = this.useCaseAssignments.textLogos;
      if (eligibleModels.some(m => m.id === textModel)) {
        recommended = textModel;
        reasoning = 'Text or logos detected. Text preservation model selected.';
      }
    } else if (
      (analysis.faceCount && analysis.faceCount > 0) ||
      analysis.contentType === 'portrait' ||
      analysis.contentType === 'vintage'
    ) {
      const portraitModel = this.useCaseAssignments.portraits;
      if (eligibleModels.some(m => m.id === portraitModel)) {
        recommended = portraitModel;
        reasoning = 'Portrait or old photo detected. Face restoration model selected.';
      }
    } else if (analysis.noiseLevel && analysis.noiseLevel > 0.5) {
      const qualityModel = this.useCaseAssignments.maxQuality;
      if (eligibleModels.some(m => m.id === qualityModel)) {
        recommended = qualityModel;
        reasoning = 'Noise detected. Higher quality upscaler selected.';
      }
    }

    // Fallback if recommended model not eligible
    if (!eligibleModels.some(m => m.id === recommended)) {
      recommended = eligibleModels[0]?.id || this.useCaseAssignments.generalUpscale;
      reasoning = 'Standard upscaling selected (best available for your tier).';
    }

    // Get alternatives (exclude recommended)
    const alternatives = eligibleModels
      .filter(m => m.id !== recommended)
      .slice(0, 2)
      .map(m => m.id);

    const creditCost = this.calculateCreditCostWithMode(
      recommended,
      scale,
      mode as 'upscale' | 'enhance' | 'both'
    );

    return {
      recommendedModel: recommended,
      reasoning,
      creditCost,
      alternatives,
      confidence: 0.7,
    };
  }

  /**
   * Get provider for a model
   */
  getProviderForModel(modelId: string): { provider: ModelProvider; useFallback: boolean } {
    const model = this.getModel(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    return { provider: model.provider, useFallback: false };
  }

  /**
   * Reset registry (useful for testing)
   */
  reset(): void {
    this.models.clear();
    this.loadModelsFromEnvironment();
    this.loadUseCaseAssignments();
  }

  /**
   * Get use-case assignments (for debugging/testing)
   */
  getUseCaseAssignments(): Record<string, string> {
    return { ...this.useCaseAssignments };
  }
}
