import { buildPrompt } from '../../utils/prompt.builder';
import type { IModelInputContext } from '../model-input.types';
import type { INanoBananaProInput } from '../model-input.types';
import { BaseModelInputBuilder } from './base-model.builder';

/**
 * Map scale to resolution for Nano Banana Pro
 */
const SCALE_TO_RESOLUTION: Record<number, '1K' | '2K' | '4K'> = {
  2: '2K',
  4: '4K',
  8: '4K', // Max supported is 4K
};

/**
 * Nano Banana Pro Model Input Builder
 *
 * Premium upscale model with resolution presets (1K/2K/4K)
 * Uses resolution-based output, not true pixel multiplication
 */
export class NanoBananaProBuilder extends BaseModelInputBuilder<INanoBananaProInput> {
  readonly modelId = 'nano-banana-pro';

  build(context: IModelInputContext): INanoBananaProInput {
    const { imageDataUrl, scale, nanoBananaProConfig } = context;

    // Build prompt using centralized prompt builder
    const prompt = buildPrompt(this.modelId, context);

    // Use config resolution if provided, otherwise map from scale
    const resolution = nanoBananaProConfig?.resolution || SCALE_TO_RESOLUTION[scale] || '2K';

    return {
      prompt,
      image_input: [imageDataUrl],
      aspect_ratio: nanoBananaProConfig?.aspectRatio || 'match_input_image',
      resolution,
      output_format: nanoBananaProConfig?.outputFormat || 'png',
      safety_filter_level: nanoBananaProConfig?.safetyFilterLevel || 'block_only_high',
    };
  }
}
