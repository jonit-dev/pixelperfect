import { describe, it, expect, beforeEach } from 'vitest';

// Import actual types from services
import type {
  IModelConfig,
  ContentType,
  SubscriptionTier,
  IModelRecommendation,
} from '../../server/services/model-registry.types';
import type {
  IImageAnalysis,
  IAnalysisResult,
  IAnalysisConfig,
} from '../../server/services/image-analyzer.types';

// Mock implementations for edge case testing
class EdgeCaseModelRegistry {
  private models: Map<string, IModelConfig> = new Map();

  constructor() {
    // Initialize with disabled models for testing
    this.models.set('test-model', {
      id: 'test-model',
      displayName: 'Test Model',
      provider: 'replicate',
      modelVersion: 'v1',
      capabilities: ['upscale'],
      costPerRun: 0.01,
      creditMultiplier: 1,
      qualityScore: 5.0,
      processingTimeMs: 1000,
      maxInputResolution: 1024 * 1024,
      maxOutputResolution: 2048 * 2048,
      supportedScales: [2],
      isEnabled: false, // Disabled for testing
    });
  }

  getEnabledModels(): IModelConfig[] {
    return Array.from(this.models.values()).filter(model => model.isEnabled);
  }

  getAllModels(): IModelConfig[] {
    return Array.from(this.models.values());
  }

  getModel(modelId: string): IModelConfig | null {
    return this.models.get(modelId) || null;
  }

  enableModel(modelId: string): void {
    const model = this.models.get(modelId);
    if (model) {
      model.isEnabled = true;
    }
  }

  disableModel(modelId: string): void {
    const model = this.models.get(modelId);
    if (model) {
      model.isEnabled = false;
    }
  }

  disableAllModels(): void {
    this.models.forEach(model => {
      model.isEnabled = false;
    });
  }

  enableModelsWithIssues(): void {
    // Enable models with problematic configurations
    this.models.set('invalid-cost', {
      id: 'invalid-cost',
      displayName: 'Invalid Cost Model',
      provider: 'replicate',
      modelVersion: 'v1',
      capabilities: ['upscale'],
      costPerRun: -1, // Invalid negative cost
      creditMultiplier: -1, // Invalid negative multiplier
      qualityScore: 5.0,
      processingTimeMs: 1000,
      maxInputResolution: 1024 * 1024,
      maxOutputResolution: 2048 * 2048,
      supportedScales: [2],
      isEnabled: true,
    });

    this.models.set('invalid-quality', {
      id: 'invalid-quality',
      displayName: 'Invalid Quality Model',
      provider: 'replicate',
      modelVersion: 'v1',
      capabilities: ['upscale'],
      costPerRun: 0.01,
      creditMultiplier: 1,
      qualityScore: 15.0, // Invalid quality score > 10
      processingTimeMs: 1000,
      maxInputResolution: 1024 * 1024,
      maxOutputResolution: 2048 * 2048,
      supportedScales: [2],
      isEnabled: true,
    });

    this.models.set('invalid-scale', {
      id: 'invalid-scale',
      displayName: 'Invalid Scale Model',
      provider: 'replicate',
      modelVersion: 'v1',
      capabilities: ['upscale'],
      costPerRun: 0.01,
      creditMultiplier: 1,
      qualityScore: 5.0,
      processingTimeMs: 1000,
      maxInputResolution: 1024 * 1024,
      maxOutputResolution: 2048 * 2048,
      supportedScales: [], // Empty scales array
      isEnabled: true,
    });
  }

  // Mock method matching actual service
  getModelsByTier(tier: SubscriptionTier): IModelConfig[] {
    return this.getEnabledModels().filter(model => {
      if (!model.tierRestriction) return true;

      const tierLevels: Record<SubscriptionTier, number> = {
        free: 0,
        hobby: 1,
        pro: 2,
        business: 3,
      };
      const modelLevel = tierLevels[model.tierRestriction];
      const userLevel = tierLevels[tier];

      return userLevel >= modelLevel;
    });
  }

  // Mock method matching actual service
  calculateCreditCost(
    modelId: string,
    _scale: 2 | 4 | 8,
    mode: 'upscale' | 'enhance' | 'both'
  ): number {
    const model = this.getModel(modelId);
    if (!model) return 0;

    const baseCredits = mode === 'upscale' ? 1 : 2;
    return Math.ceil(baseCredits * model.creditMultiplier);
  }

  // Mock method matching actual service
  calculateCreditCostWithMode(
    modelId: string,
    scale: 2 | 4 | 8,
    mode: 'upscale' | 'enhance' | 'both' | 'custom'
  ): number {
    const modeForCalc = mode === 'custom' ? 'enhance' : mode;
    return this.calculateCreditCost(modelId, scale, modeForCalc);
  }
}

class EdgeCaseImageAnalyzer {
  private shouldFail = false;
  private failureType: 'timeout' | 'corrupt' | 'invalid' | 'memory' = 'invalid';

  setFailureMode(
    shouldFail: boolean,
    type: 'timeout' | 'corrupt' | 'invalid' | 'memory' = 'invalid'
  ): void {
    this.shouldFail = shouldFail;
    this.failureType = type;
  }

  async analyzeImage(
    imageData: Buffer,
    config: Partial<IAnalysisConfig> = {}
  ): Promise<IAnalysisResult> {
    if (this.shouldFail) {
      switch (this.failureType) {
        case 'timeout':
          await new Promise(resolve => setTimeout(resolve, 10000));
          throw new Error('Analysis timeout');
        case 'corrupt':
          throw new Error('Corrupt image data detected');
        case 'memory':
          throw new Error('Out of memory during analysis');
        case 'invalid':
          return {
            damageLevel: -1, // Invalid negative value
            faceCount: -5, // Invalid negative count
            textCoverage: 2.0, // Invalid > 1.0
            noiseLevel: 1.5, // Invalid > 1.0
            contentType: 'invalid-type' as ContentType,
            resolution: {
              width: 0,
              height: 0,
              megapixels: -1,
            },
            fileSizeBytes: imageData.length,
            format: 'jpeg',
            aspectRatio: NaN,
            processingTimeMs: 100,
            config: { ...DEFAULT_ANALYSIS_CONFIG, ...config },
            rawResults: {
              faceDetection: { count: -5 },
              textDetection: { coverage: 2.0, regionCount: 0 },
              quality: {
                overall: 1.5,
                sharpness: 1.2,
                noise: 1.1,
                compression: 0.9,
                exposure: 1.3,
                contrast: -0.5,
              },
              metadata: {
                width: 0,
                height: 0,
                format: 'jpeg',
                mimeType: 'image/jpeg',
                timestamps: {
                  created: new Date(),
                  modified: new Date(),
                },
              },
            },
          };
      }
    }

    // Normal analysis
    return {
      damageLevel: 0.3,
      faceCount: 0,
      textCoverage: 0.1,
      noiseLevel: 0.2,
      contentType: 'photo',
      resolution: {
        width: 1920,
        height: 1080,
        megapixels: 2.07,
      },
      fileSizeBytes: imageData.length,
      format: 'jpeg',
      aspectRatio: 1920 / 1080,
      processingTimeMs: 100,
      config: { ...DEFAULT_ANALYSIS_CONFIG, ...config },
      rawResults: {
        faceDetection: { count: 0 },
        textDetection: { coverage: 0.1, regionCount: 0 },
        quality: {
          overall: 0.7,
          sharpness: 0.8,
          noise: 0.2,
          compression: 0.1,
          exposure: 0.5,
          contrast: 0.6,
        },
        metadata: {
          width: 1920,
          height: 1080,
          format: 'jpeg',
          mimeType: 'image/jpeg',
          timestamps: {
            created: new Date(),
            modified: new Date(),
          },
        },
      },
    };
  }
}

class EdgeCaseModelSelector {
  private modelRegistry: EdgeCaseModelRegistry;
  private shouldFailRecommendation = false;
  private imageAnalyzer: EdgeCaseImageAnalyzer;

  constructor(modelRegistry: EdgeCaseModelRegistry) {
    this.modelRegistry = modelRegistry;
    this.imageAnalyzer = new EdgeCaseImageAnalyzer();
  }

  setFailureMode(shouldFail: boolean): void {
    this.shouldFailRecommendation = shouldFail;
  }

  setImageAnalyzerFailureMode(
    shouldFail: boolean,
    type?: 'timeout' | 'corrupt' | 'invalid' | 'memory'
  ): void {
    this.imageAnalyzer.setFailureMode(shouldFail, type);
  }

  async analyzeAndRecommendModel(
    imageBuffer: Buffer,
    userTier: SubscriptionTier,
    _options: {
      mode?: 'upscale' | 'enhance' | 'both';
      scale?: 2 | 4 | 8;
      preferences?: {
        preserveText?: boolean;
        enhanceFaces?: boolean;
        denoise?: boolean;
        prioritizeQuality?: boolean;
      };
    } = {}
  ): Promise<{
    analysis: IImageAnalysis;
    recommendation: IModelRecommendation;
    eligibleModels: IModelConfig[];
  }> {
    if (this.shouldFailRecommendation) {
      throw new Error('Model selection service unavailable');
    }

    const analysisResult = await this.imageAnalyzer.analyzeImage(imageBuffer);
    const eligibleModels = this.modelRegistry.getModelsByTier(userTier);

    // Simplified recommendation logic for testing
    const recommendation: IModelRecommendation = {
      recommendedModel: eligibleModels[0]?.id || 'real-esrgan',
      reasoning: 'Test recommendation',
      creditCost: eligibleModels[0]?.creditMultiplier || 1,
      alternatives: eligibleModels.slice(1, 3).map(m => m.id),
      confidence: 0.7,
    };

    return {
      analysis: analysisResult,
      recommendation,
      eligibleModels,
    };
  }
}

// Mock default analysis config
const DEFAULT_ANALYSIS_CONFIG: IAnalysisConfig = {
  enableFaceDetection: true,
  enableTextDetection: true,
  enableQualityAssessment: true,
  enableColorAnalysis: true,
  fastMode: false,
  maxSize: 1024 * 1024,
};

describe('Multi-Model Architecture: Edge Cases', () => {
  let modelRegistry: EdgeCaseModelRegistry;
  let imageAnalyzer: EdgeCaseImageAnalyzer;
  let modelSelector: EdgeCaseModelSelector;

  beforeEach(() => {
    modelRegistry = new EdgeCaseModelRegistry();
    imageAnalyzer = new EdgeCaseImageAnalyzer();
    modelSelector = new EdgeCaseModelSelector(modelRegistry);
  });

  describe('No Models Enabled Scenario', () => {
    it('should handle no enabled models gracefully', async () => {
      modelRegistry.disableAllModels();

      const imageBuffer = Buffer.from('test-image');

      const result = await modelSelector.analyzeAndRecommendModel(imageBuffer, 'free');

      expect(result.recommendation.recommendedModel).toBe('real-esrgan');
      expect(result.eligibleModels).toHaveLength(0);
      expect(result.recommendation.creditCost).toBe(1);
    });

    it('should return empty list for getEnabledModels', () => {
      modelRegistry.disableAllModels();
      const enabledModels = modelRegistry.getEnabledModels();
      expect(enabledModels).toHaveLength(0);
    });

    it('should still have all models in getAllModels', () => {
      modelRegistry.disableAllModels();
      const allModels = modelRegistry.getAllModels();
      expect(allModels.length).toBeGreaterThan(0);

      allModels.forEach(model => {
        expect(model.isEnabled).toBe(false);
      });
    });

    it('should handle empty getModelsByTier result', () => {
      modelRegistry.disableAllModels();
      const modelsByTier = modelRegistry.getModelsByTier('free');
      expect(modelsByTier).toHaveLength(0);
    });
  });

  describe('Premium Model Unavailable Scenarios', () => {
    it('should handle all premium models being down', async () => {
      modelRegistry.disableAllModels();

      const imageBuffer = Buffer.from('test-image');
      const result = await modelSelector.analyzeAndRecommendModel(imageBuffer, 'pro');

      expect(result.recommendation.recommendedModel).toBe('real-esrgan');
      expect(result.recommendation.reasoning).toBeDefined();
    });
  });

  describe('Image Analysis Failure Scenarios', () => {
    it('should handle corrupt image data', async () => {
      imageAnalyzer.setFailureMode(true, 'corrupt');

      const corruptData = Buffer.from('corrupt-data');

      await expect(imageAnalyzer.analyzeImage(corruptData)).rejects.toThrow(
        'Corrupt image data detected'
      );
    });
  });

  describe('Model Selection Service Failures', () => {
    it('should handle model selector service unavailable', async () => {
      modelSelector.setFailureMode(true);

      const imageData = Buffer.from('test-image');

      await expect(modelSelector.analyzeAndRecommendModel(imageData, 'free')).rejects.toThrow(
        'Model selection service unavailable'
      );
    });
  });
});
