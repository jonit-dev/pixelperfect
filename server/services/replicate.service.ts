import { isRateLimitError, withRetry } from '@server/utils/retry';
import { serverEnv } from '@shared/config/env';
import { serializeError } from '@shared/utils/errors';
import type { IUpscaleInput } from '@shared/validation/upscale.schema';
import Replicate from 'replicate';
import { calculateCreditCost } from './image-generation.service';
import type {
  IImageProcessor,
  IImageProcessorResult,
  IProcessImageOptions,
} from './image-processor.interface';
import { ModelRegistry } from './model-registry';

// Refactored utilities
import { buildModelInput, type IModelInput } from './replicate/builders';
import { creditManager } from './replicate/utils/credit-manager';
import { replicateErrorMapper } from './replicate/utils/error-mapper';
import { parseReplicateResponse } from './replicate/utils/output-parser';

/**
 * Re-export ReplicateError for backward compatibility
 */
export { ReplicateError } from './replicate/utils/error-mapper';

/**
 * Service for image upscaling via Replicate
 *
 * Refactored to follow SOLID principles:
 * - Single Responsibility: Delegates to specialized utilities
 * - Open/Closed: Extensible through model builders
 * - Dependency Inversion: Depends on abstractions
 *
 * Cost: ~$0.0017/image on T4 GPU
 * Speed: ~1-2 seconds per image
 */
export class ReplicateService implements IImageProcessor {
  public readonly providerName = 'Replicate';
  private replicate: Replicate;
  private modelVersion: string;
  private modelId: string;

  constructor(modelId: string = 'real-esrgan') {
    const apiToken = serverEnv.REPLICATE_API_TOKEN;
    if (!apiToken) {
      throw new Error('REPLICATE_API_TOKEN is not configured');
    }

    this.replicate = new Replicate({ auth: apiToken });
    this.modelVersion = serverEnv.REPLICATE_MODEL_VERSION;
    this.modelId = modelId;
  }

  /**
   * Check if Replicate supports the given processing mode
   */
  supportsMode(mode: string): boolean {
    return ['upscale', 'both'].includes(mode);
  }

  /**
   * Process an image upscale request via Replicate
   */
  async processImage(
    userId: string,
    input: IUpscaleInput,
    options?: IProcessImageOptions
  ): Promise<IImageProcessorResult> {
    const creditCost = options?.creditCost ?? calculateCreditCost(input.config);

    // Step 1: Deduct credits atomically using CreditManager
    const { newBalance, jobId } = await creditManager.deductCredits(
      userId,
      creditCost,
      this.providerName
    );

    try {
      // Step 2: Call Replicate API
      const result = await this.callReplicate(input);

      return {
        ...result,
        creditsRemaining: newBalance,
      };
    } catch (error) {
      // Step 3: Refund on failure
      await creditManager.refundCredits(userId, jobId, creditCost);
      throw error;
    }
  }

  /**
   * Get the model version for a given model ID from the registry
   */
  private getModelVersionForId(modelId: string): string {
    const registry = ModelRegistry.getInstance();
    const model = registry.getModel(modelId);

    if (model && model.modelVersion) {
      return model.modelVersion;
    }

    return this.modelVersion;
  }

  /**
   * Build model input for testing purposes
   *
   * Exposes the builder system for testing while keeping the main implementation private
   *
   * @param modelId - The model ID
   * @param imageDataUrl - The image data URL
   * @param input - The upscale input
   * @returns The model-specific input
   */
  public buildModelInputForTest(
    modelId: string,
    imageDataUrl: string,
    input: IUpscaleInput
  ): IModelInput {
    const inputWithUrl = {
      ...input,
      imageData: imageDataUrl,
    };
    return buildModelInput(modelId, inputWithUrl);
  }

  /**
   * Build model input using the orchestrator (private method)
   *
   * This is now a simple delegation to the builder system
   */
  private buildModelInput(
    modelId: string,
    imageDataUrl: string,
    input: IUpscaleInput
  ): IModelInput {
    // For image URL consistency, ensure we use the passed imageDataUrl
    const inputWithUrl = {
      ...input,
      imageData: imageDataUrl,
    };
    return buildModelInput(modelId, inputWithUrl);
  }

  /**
   * Call the Replicate model (supports multiple models from registry)
   */
  private async callReplicate(input: IUpscaleInput): Promise<{
    imageUrl: string;
    mimeType: string;
    expiresAt: number;
  }> {
    // Prepare image data - ensure it's a data URL
    let imageDataUrl = input.imageData;
    if (!imageDataUrl.startsWith('data:')) {
      const mimeType = input.mimeType || 'image/jpeg';
      imageDataUrl = `data:${mimeType};base64,${imageDataUrl}`;
    }

    // Use the instance's modelId
    const selectedModel = this.modelId;
    const modelVersion =
      selectedModel !== 'auto' ? this.getModelVersionForId(selectedModel) : this.modelVersion;

    // Prepare Replicate input using the builder system
    const replicateInput = this.buildModelInput(selectedModel, imageDataUrl, input);

    try {
      // Run with retry for rate limits
      const output = await withRetry(
        () =>
          this.replicate.run(modelVersion as `${string}/${string}:${string}`, {
            input: replicateInput,
          }),
        {
          shouldRetry: err => isRateLimitError(serializeError(err)),
          onRetry: (attempt, delayMs) => {
            console.log(
              `[Replicate] Rate limited, retrying in ${delayMs}ms (attempt ${attempt}/3)`
            );
          },
        }
      );

      // Parse response using output parser
      return parseReplicateResponse(output);
    } catch (error) {
      // Map errors using error mapper
      throw replicateErrorMapper.mapError(error);
    }
  }
}

// Export factory function for model-specific instances
export function createReplicateService(modelId: string): ReplicateService {
  return new ReplicateService(modelId);
}

// Export singleton for backward compatibility (default model)
let replicateServiceInstance: ReplicateService | null = null;

export function getReplicateService(): ReplicateService {
  if (!replicateServiceInstance) {
    replicateServiceInstance = new ReplicateService();
  }
  return replicateServiceInstance;
}
