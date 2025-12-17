import Replicate from 'replicate';
import { serverEnv } from '@shared/config/env';
import { supabaseAdmin } from '@server/supabase/supabaseAdmin';
import type { IUpscaleInput } from '@shared/validation/upscale.schema';
import { calculateCreditCost, InsufficientCreditsError } from './image-generation.service';
import type { IImageProcessor, IImageProcessorResult } from './image-processor.interface';
import { serializeError } from '@shared/utils/errors';
import { ModelRegistry } from './model-registry';

/**
 * Custom error for Replicate-specific failures
 */
export class ReplicateError extends Error {
  public readonly code: string;

  constructor(message: string, code: string = 'REPLICATE_ERROR') {
    super(message);
    this.name = 'ReplicateError';
    this.code = code;
  }
}

/**
 * Replicate API input for Real-ESRGAN
 */
interface IRealEsrganInput {
  image: string; // URL or data URL
  scale?: number; // 2 or 4 (default 4)
  face_enhance?: boolean; // Use GFPGAN for faces
}

/**
 * Replicate API input for GFPGAN
 */
interface IGfpganInput {
  img: string; // URL or data URL (note: 'img' not 'image')
  scale?: number; // Rescaling factor (default 2)
  version?: 'v1.2' | 'v1.3' | 'v1.4' | 'RestoreFormer';
}

/**
 * Replicate API input for Clarity Upscaler
 */
interface IClarityUpscalerInput {
  image: string;
  prompt?: string;
  scale_factor?: number; // Magnification (2-16, default 2)
  creativity?: number; // 0-1, default 0.35
  resemblance?: number; // 0-3, default 0.6
  dynamic?: number; // HDR intensity (1-50, default 6)
  output_format?: string;
}

/**
 * Replicate API input for Flux-Kontext-Pro
 */
interface IFluxKontextInput {
  prompt: string;
  input_image: string;
  aspect_ratio: string;
  output_format: string;
}

/**
 * Replicate API input for Nano Banana Pro (Google)
 */
interface INanoBananaProInput {
  prompt: string;
  image_input?: string[];
  aspect_ratio?:
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
  resolution?: '1K' | '2K' | '4K';
  output_format?: 'jpg' | 'png';
  safety_filter_level?: 'block_low_and_above' | 'block_medium_and_above' | 'block_only_high';
}

/**
 * Service for image upscaling via Replicate Real-ESRGAN
 *
 * Cost: ~$0.0017/image on T4 GPU
 * Speed: ~1-2 seconds per image
 *
 * Implements IImageProcessor interface for provider abstraction.
 */
export class ReplicateService implements IImageProcessor {
  public readonly providerName = 'Replicate';
  private replicate: Replicate;
  private modelVersion: string;

  constructor() {
    const apiToken = serverEnv.REPLICATE_API_TOKEN;
    if (!apiToken) {
      throw new Error('REPLICATE_API_TOKEN is not configured');
    }

    this.replicate = new Replicate({ auth: apiToken });
    this.modelVersion = serverEnv.REPLICATE_MODEL_VERSION;
  }

  /**
   * Check if Replicate supports the given processing mode
   *
   * Replicate (Real-ESRGAN) is optimized for pure upscaling operations.
   * For creative enhancement, use Gemini instead.
   */
  supportsMode(mode: string): boolean {
    return ['upscale', 'both'].includes(mode);
  }

  /**
   * Process an image upscale request via Replicate
   *
   * @param userId - The authenticated user's ID
   * @param input - The validated upscale input
   * @returns The upscaled image data and remaining credits
   * @throws InsufficientCreditsError if user has no credits
   * @throws ReplicateError if API call fails
   */
  async processImage(userId: string, input: IUpscaleInput): Promise<IImageProcessorResult> {
    const jobId = `rep_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const creditCost = calculateCreditCost(input.config);

    // Step 1: Deduct credits atomically using FIFO (subscription first, then purchased)
    const { data: balanceResult, error: creditError } = await supabaseAdmin.rpc(
      'consume_credits_v2',
      {
        target_user_id: userId,
        amount: creditCost,
        ref_id: jobId,
        description: `Image upscale via Replicate (${creditCost} credits)`,
      }
    );

    if (creditError) {
      if (creditError.message?.includes('Insufficient credits')) {
        throw new InsufficientCreditsError(creditError.message);
      }
      throw new Error(`Failed to deduct credits: ${creditError.message}`);
    }

    // Extract total balance from result (returns array with single row)
    const newBalance = balanceResult?.[0]?.new_total_balance ?? 0;

    try {
      // Step 2: Call Replicate API
      const result = await this.callReplicate(input);

      return {
        ...result,
        creditsRemaining: newBalance,
      };
    } catch (error) {
      // Step 3: Refund on failure
      await this.refundCredits(userId, jobId, creditCost);
      throw error;
    }
  }

  /**
   * Refund credits for a failed upscale
   */
  private async refundCredits(userId: string, jobId: string, amount: number): Promise<void> {
    const { error } = await supabaseAdmin.rpc('refund_credits', {
      target_user_id: userId,
      amount,
      job_id: jobId,
    });

    if (error) {
      console.error('Failed to refund credits:', error);
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

    // Fallback to default model version
    return this.modelVersion;
  }

  /**
   * Build model-specific input parameters
   */
  private buildModelInput(
    modelId: string,
    imageDataUrl: string,
    input: IUpscaleInput
  ):
    | IFluxKontextInput
    | IRealEsrganInput
    | IGfpganInput
    | IClarityUpscalerInput
    | INanoBananaProInput {
    const scale = input.config.scale;
    const prompt = input.config.customPrompt;

    switch (modelId) {
      case 'clarity-upscaler':
        return {
          image: imageDataUrl,
          prompt: prompt || 'masterpiece, best quality, highres',
          scale_factor: scale, // Supports 2-16
          output_format: 'png',
        };

      case 'gfpgan':
        return {
          img: imageDataUrl, // Note: GFPGAN uses 'img' not 'image'
          scale: scale <= 4 ? scale : 4, // GFPGAN max scale is 4
          version: 'v1.4',
        };

      case 'flux-kontext-pro':
        return {
          prompt: prompt || 'enhance and upscale this image, improve quality and details',
          input_image: imageDataUrl,
          aspect_ratio: 'match_input_image',
          output_format: 'png',
        };

      case 'nano-banana-pro': {
        // Build a descriptive prompt based on the operation mode
        const ultraConfig = input.config.nanoBananaProConfig;
        let effectivePrompt = prompt;

        if (!effectivePrompt) {
          // Generate a default prompt based on mode
          switch (input.config.mode) {
            case 'upscale':
              effectivePrompt = `Upscale this image to ${scale}x resolution with enhanced sharpness and detail.`;
              break;
            case 'enhance':
              effectivePrompt =
                'Enhance this image: improve clarity, colors, lighting, and remove any artifacts or noise.';
              break;
            case 'both':
            default:
              effectivePrompt = `Upscale this image to ${scale}x resolution while enhancing clarity, colors, and details. Remove noise and artifacts for a crisp, professional result.`;
              break;
          }

          // Add face enhancement instruction if enabled
          if (input.config.enhanceFace) {
            effectivePrompt += ' Enhance facial features naturally without altering identity.';
          }

          // Add text preservation instruction if enabled
          if (input.config.preserveText) {
            effectivePrompt += ' Preserve and sharpen any text or logos in the image.';
          }
        }

        // Map scale to resolution
        const scaleToResolution: Record<number, '1K' | '2K' | '4K'> = {
          2: '2K',
          4: '4K',
          8: '4K', // Max supported is 4K
        };

        return {
          prompt: effectivePrompt,
          image_input: [imageDataUrl],
          aspect_ratio: ultraConfig?.aspectRatio || 'match_input_image',
          resolution: ultraConfig?.resolution || scaleToResolution[scale] || '2K',
          output_format: ultraConfig?.outputFormat || 'png',
          safety_filter_level: ultraConfig?.safetyFilterLevel || 'block_only_high',
        };
      }

      case 'real-esrgan':
      default:
        // Real-ESRGAN only supports scale 2 or 4
        return {
          image: imageDataUrl,
          scale: scale === 2 ? 2 : 4,
          face_enhance: input.config.enhanceFace || false,
        };
    }
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

    // Get the model version based on selected model
    const selectedModel = input.config.selectedModel || 'real-esrgan';
    const modelVersion =
      selectedModel !== 'auto' ? this.getModelVersionForId(selectedModel) : this.modelVersion;

    // Prepare Replicate input based on model type
    const replicateInput = this.buildModelInput(selectedModel, imageDataUrl, input);

    // Log the full input being sent to the model (excluding image data for brevity)
    const logInput = { ...replicateInput } as Record<string, unknown>;
    if ('image' in logInput) logInput.image = '[BASE64_IMAGE]';
    if ('img' in logInput) logInput.img = '[BASE64_IMAGE]';
    if ('input_image' in logInput) logInput.input_image = '[BASE64_IMAGE]';
    if ('image_input' in logInput) logInput.image_input = ['[BASE64_IMAGE]'];

    console.log('[Replicate] Model input:', {
      model: selectedModel,
      modelVersion,
      input: logInput,
    });

    try {
      // Run the model - returns output URL(s)
      const output = await this.replicate.run(modelVersion as `${string}/${string}:${string}`, {
        input: replicateInput,
      });

      console.log('[Replicate] Raw output type:', typeof output);
      console.log('[Replicate] Raw output value:', output);
      console.log('[Replicate] Is array:', Array.isArray(output));

      // Handle different output formats
      let outputUrl: string;

      // Helper to extract URL string from various formats with detailed logging
      const extractUrl = (value: unknown, label: string): string | null => {
        console.log(`[Replicate] extractUrl(${label}):`, {
          type: typeof value,
          isNull: value === null,
          isUndefined: value === undefined,
          constructor: value?.constructor?.name,
        });

        if (typeof value === 'string') {
          console.log(`[Replicate] ${label}: Got direct string URL`);
          return value;
        }

        if (value && typeof value === 'object') {
          const keys = Object.keys(value);
          console.log(`[Replicate] ${label}: Object keys:`, keys.slice(0, 10));

          // FileOutput objects can be converted to string (they extend URL class)
          if (typeof (value as { toString?: () => string }).toString === 'function') {
            const stringified = String(value);
            console.log(`[Replicate] ${label}: String(value) =`, stringified.slice(0, 100));
            // Check if it's a valid URL string (not [object Object])
            if (stringified.startsWith('http')) {
              console.log(`[Replicate] ${label}: Extracted via String() conversion`);
              return stringified;
            }
          }

          // Try .url property (could be string or function)
          if ('url' in value) {
            const urlValue = (value as { url: unknown }).url;
            console.log(`[Replicate] ${label}: .url type =`, typeof urlValue);
            if (typeof urlValue === 'function') {
              const result = urlValue();
              console.log(`[Replicate] ${label}: .url() returned:`, String(result).slice(0, 100));
              return result;
            }
            if (typeof urlValue === 'string') {
              console.log(`[Replicate] ${label}: .url is string`);
              return urlValue;
            }
          }

          // Try .href property (URL-like objects)
          if ('href' in value && typeof (value as { href: unknown }).href === 'string') {
            console.log(`[Replicate] ${label}: Extracted via .href property`);
            return (value as { href: string }).href;
          }

          console.log(`[Replicate] ${label}: Could not extract URL from object`);
        }

        return null;
      };

      if (Array.isArray(output)) {
        // Some models return array of URLs or FileOutput objects
        console.log('[Replicate] Processing array output, length:', output.length);
        const first = output[0];
        const extracted = extractUrl(first, 'array[0]');
        if (extracted) {
          outputUrl = extracted;
          console.log('[Replicate] Successfully extracted URL from array:', outputUrl.slice(0, 80));
        } else {
          console.error('[Replicate] FAILED to extract URL from array element:', {
            type: typeof first,
            keys: first && typeof first === 'object' ? Object.keys(first) : 'N/A',
            value: String(first).slice(0, 200),
            prototypeChain: first?.constructor?.name,
          });
          throw new ReplicateError('Unexpected array output format from Replicate', 'NO_OUTPUT');
        }
      } else {
        console.log('[Replicate] Processing non-array output');
        const extracted = extractUrl(output, 'output');
        if (extracted) {
          outputUrl = extracted;
          console.log('[Replicate] Successfully extracted URL:', outputUrl.slice(0, 80));
        } else {
          throw new ReplicateError(
            `No output URL returned from Replicate. Got: ${JSON.stringify(output)}`,
            'NO_OUTPUT'
          );
        }
      }

      if (!outputUrl) {
        throw new ReplicateError('Output URL is empty', 'NO_OUTPUT');
      }

      // Return URL directly - browser will fetch the image
      // This avoids CPU-intensive Buffer operations on the server (Cloudflare Workers 10ms limit)
      // Replicate URLs are valid for ~1 hour
      const mimeType = outputUrl.toLowerCase().includes('.png')
        ? 'image/png'
        : outputUrl.toLowerCase().includes('.webp')
          ? 'image/webp'
          : 'image/jpeg';

      return {
        imageUrl: outputUrl,
        mimeType,
        expiresAt: Date.now() + 3600000, // 1 hour
      };
    } catch (error) {
      // Map Replicate-specific errors
      const message = serializeError(error);

      if (message.includes('rate limit') || message.includes('429')) {
        throw new ReplicateError(
          'Replicate rate limit exceeded. Please try again.',
          'RATE_LIMITED'
        );
      }

      if (message.includes('NSFW') || message.includes('safety')) {
        throw new ReplicateError('Image flagged by safety filter.', 'SAFETY');
      }

      if (message.includes('timeout') || message.includes('timed out')) {
        throw new ReplicateError('Processing timed out. Please try a smaller image.', 'TIMEOUT');
      }

      if (error instanceof ReplicateError) {
        throw error;
      }

      throw new ReplicateError(`Upscale failed: ${message}`, 'PROCESSING_FAILED');
    }
  }
}

// Export singleton for convenience
let replicateServiceInstance: ReplicateService | null = null;

export function getReplicateService(): ReplicateService {
  if (!replicateServiceInstance) {
    replicateServiceInstance = new ReplicateService();
  }
  return replicateServiceInstance;
}
