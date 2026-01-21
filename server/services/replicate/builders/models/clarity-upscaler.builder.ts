import { buildPrompt } from '../../utils/prompt.builder';
import type { IModelInputContext } from '../model-input.types';
import type { IClarityUpscalerInput } from '../model-input.types';
import { BaseModelInputBuilder } from './base-model.builder';

/**
 * Clarity Upscaler Model Input Builder
 *
 * High detail preservation model
 * Supports scale factors 2-16
 */
export class ClarityUpscalerBuilder extends BaseModelInputBuilder<IClarityUpscalerInput> {
  readonly modelId = 'clarity-upscaler';

  build(context: IModelInputContext): IClarityUpscalerInput {
    const { imageDataUrl, scale } = context;

    // Build prompt using centralized prompt builder
    const prompt = buildPrompt(this.modelId, context);

    return {
      image: imageDataUrl,
      prompt,
      scale_factor: scale, // Supports 2-16
      output_format: 'png',
    };
  }
}
