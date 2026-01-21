import { buildPrompt } from '../../utils/prompt.builder';
import type { IModelInputContext } from '../model-input.types';
import type { IFlux2ProInput } from '../model-input.types';
import { BaseModelInputBuilder } from './base-model.builder';

/**
 * Flux-2-Pro Model Input Builder
 *
 * Premium face restoration model (enhancement-only, no true upscaling)
 * Uses input_images array format
 */
export class Flux2ProBuilder extends BaseModelInputBuilder<IFlux2ProInput> {
  readonly modelId = 'flux-2-pro';

  build(context: IModelInputContext): IFlux2ProInput {
    const { imageDataUrl } = context;

    // Build prompt using centralized prompt builder with "No creative changes" suffix
    const prompt = buildPrompt(this.modelId, context, { includeNoCreativeChanges: true });

    return {
      prompt,
      input_images: [imageDataUrl],
      aspect_ratio: 'match_input_image',
      output_format: 'png',
      safety_tolerance: 2,
      prompt_upsampling: false,
    };
  }
}
