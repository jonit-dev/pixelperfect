import { buildPrompt } from '../../utils/prompt.builder';
import type { IModelInputContext } from '../model-input.types';
import type { IFluxKontextInput } from '../model-input.types';
import { BaseModelInputBuilder } from './base-model.builder';

/**
 * Flux Kontext Pro Model Input Builder
 *
 * High-quality upscale and enhance model
 */
export class FluxKontextBuilder extends BaseModelInputBuilder<IFluxKontextInput> {
  readonly modelId = 'flux-kontext-pro';

  build(context: IModelInputContext): IFluxKontextInput {
    const { imageDataUrl } = context;

    // Build prompt using centralized prompt builder
    const prompt = buildPrompt(this.modelId, context);

    return {
      prompt,
      input_image: imageDataUrl,
      aspect_ratio: 'match_input_image',
      output_format: 'png',
    };
  }
}
