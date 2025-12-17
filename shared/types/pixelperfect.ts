export enum ProcessingStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export enum ProcessingStage {
  PREPARING = 'preparing', // File encoding, validation
  ANALYZING = 'analyzing', // Image analysis (auto mode)
  ENHANCING = 'enhancing', // Main AI processing
  FINALIZING = 'finalizing', // Response handling
}

export type ProcessingMode = 'upscale' | 'enhance' | 'both' | 'custom';

// Enhancement aspects - fine-tuned options for what to enhance
export type EnhancementAspect =
  | 'clarity' // Sharpen edges and improve overall clarity
  | 'color' // Color correction and saturation balance
  | 'lighting' // Exposure and lighting adjustments
  | 'denoise' // Remove sensor noise and grain
  | 'artifacts' // Remove JPEG compression artifacts
  | 'details'; // Enhance fine details and textures

export interface IEnhancementSettings {
  clarity: boolean;
  color: boolean;
  lighting: boolean;
  denoise: boolean;
  artifacts: boolean;
  details: boolean;
}

// Default enhancement settings - most common use case
export const DEFAULT_ENHANCEMENT_SETTINGS: IEnhancementSettings = {
  clarity: true,
  color: true,
  lighting: false,
  denoise: true,
  artifacts: true,
  details: false,
};

// Multi-Model Architecture Types

export type SubscriptionTier = 'free' | 'hobby' | 'pro' | 'business';

export type ModelId =
  | 'real-esrgan'
  | 'gfpgan'
  | 'nano-banana'
  | 'nano-banana-pro'
  | 'clarity-upscaler';

export type ModelCapability =
  | 'upscale'
  | 'enhance'
  | 'text-preservation'
  | 'face-restoration'
  | 'denoise'
  | 'damage-repair'
  | '4k-output'
  | '8k-output';

export type ContentType = 'photo' | 'portrait' | 'product' | 'document' | 'vintage' | 'unknown';

export interface IModelConfig {
  id: string;
  displayName: string;
  provider: 'replicate' | 'gemini';
  modelVersion: string;
  capabilities: ModelCapability[];
  costPerRun: number;
  creditMultiplier: number;
  qualityScore: number;
  processingTimeMs: number;
  maxInputResolution: number;
  maxOutputResolution: number;
  supportedScales: number[];
  isEnabled: boolean;
  tierRestriction?: SubscriptionTier;
}

export interface IImageAnalysis {
  damageLevel: number;
  faceCount: number;
  textCoverage: number;
  noiseLevel: number;
  contentType: ContentType;
  resolution: {
    width: number;
    height: number;
    megapixels: number;
  };
}

export interface IModelRecommendation {
  recommendedModel: string;
  reasoning: string;
  creditCost: number;
  alternatives: string[];
}

// Nano Banana Pro specific configuration (Upscale Ultra)
export type NanoBananaProAspectRatio =
  | 'match_input_image'
  | '1:1'
  | '2:3'
  | '3:2'
  | '3:4'
  | '4:3'
  | '4:5'
  | '5:4'
  | '9:16'
  | '16:9'
  | '21:9';

export type NanoBananaProResolution = '1K' | '2K' | '4K';
export type NanoBananaProOutputFormat = 'jpg' | 'png';
export type NanoBananaProSafetyLevel =
  | 'block_low_and_above'
  | 'block_medium_and_above'
  | 'block_only_high';

export interface INanoBananaProConfig {
  aspectRatio: NanoBananaProAspectRatio;
  resolution: NanoBananaProResolution;
  outputFormat: NanoBananaProOutputFormat;
  safetyFilterLevel: NanoBananaProSafetyLevel;
}

export const DEFAULT_NANO_BANANA_PRO_CONFIG: INanoBananaProConfig = {
  aspectRatio: 'match_input_image',
  resolution: '2K',
  outputFormat: 'png',
  safetyFilterLevel: 'block_only_high',
};

export interface IUpscaleConfig {
  mode: ProcessingMode;
  scale: 2 | 4 | 8;
  enhanceFace: boolean;
  preserveText: boolean;
  denoise: boolean;
  customPrompt?: string;
  // Enhancement aspect settings for fine-tuned control
  enhancement: IEnhancementSettings;
  // Multi-model architecture additions (Phase 1)
  selectedModel: 'auto' | ModelId;
  autoModelSelection?: boolean;
  preferredModel?: ModelId;
  // Auto mode: allow expensive models (8+ credits) - default false
  allowExpensiveModels?: boolean;
  // Nano Banana Pro specific configuration (Upscale Ultra)
  nanoBananaProConfig?: INanoBananaProConfig;
}

export interface IBatchItem {
  id: string;
  file: File;
  previewUrl: string;
  processedUrl: string | null;
  status: ProcessingStatus;
  progress: number;
  stage?: ProcessingStage; // NEW
  error?: string;
}

export interface IProcessedImage {
  originalUrl: string;
  processedUrl: string | null;
  originalSize: number; // bytes
  processedSize?: number; // bytes
  width: number;
  height: number;
  status: ProcessingStatus;
  progress: number;
  error?: string;
}

export interface IPricingTier {
  name: string;
  price: string;
  credits: number;
  features: string[];
  recommended?: boolean;
}

// Additional multi-model types for UI components

export interface IProcessingOptions {
  selectedModel: 'auto' | ModelId;
  scale: 2 | 4 | 8;
  preserveText: boolean;
  enhanceFaces: boolean;
  denoise: boolean;
  targetResolution?: '2k' | '4k' | '8k';
}

export interface IModelInfo {
  id: ModelId | 'auto';
  displayName: string;
  description: string;
  creditCost: number;
  capabilities: ModelCapability[];
  qualityScore: number;
  processingTime: string;
  available: boolean;
  requiresTier?: SubscriptionTier;
  badge?: string;
  icon?: string;
}

export interface ICreditEstimate {
  breakdown: {
    baseCredits: number;
    featureCredits: {
      preserveText?: number;
      enhanceFaces?: number;
      denoise?: number;
    };
    scaleMultiplier: number;
    totalCredits: number;
  };
  modelToBe: string;
  estimatedProcessingTime: string;
}

export interface IModelApiResponse {
  models: IModelInfo[];
  defaultModel: string;
}

export interface IAnalyzeImageResponse {
  analysis: IImageAnalysis;
  recommendation: IModelRecommendation;
}

export interface IUpscaleResponse {
  success: boolean;
  imageData?: string; // Legacy base64 data URL (deprecated for Workers)
  imageUrl?: string; // Direct URL to result image (Cloudflare Workers optimized)
  expiresAt?: number; // Timestamp when imageUrl expires
  mimeType: string;
  processing: {
    modelUsed: string;
    modelDisplayName: string;
    processingTimeMs: number;
    creditsUsed: number;
    creditsRemaining: number;
  };
  analysis?: {
    damageLevel?: number;
    contentType?: string;
    modelRecommendation?: string;
  };
}
