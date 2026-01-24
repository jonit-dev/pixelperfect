import { buildPrompt } from '../../utils/prompt.builder';
import type { IModelInputContext } from '../model-input.types';
import type { IPImageEditInput } from '../model-input.types';
import { BaseModelInputBuilder } from './base-model.builder';

/**
 * P-Image-Edit Model Input Builder
 *
 * Fast budget image editing model - enhancement only (no upscaling support)
 * Sub-second processing, cheaper alternative to qwen-image-edit
 * Uses 'images' array parameter
 */
export class PImageEditBuilder extends BaseModelInputBuilder<IPImageEditInput> {
  readonly modelId = 'p-image-edit';

  build(context: IModelInputContext): IPImageEditInput {
    const { imageDataUrl } = context;

    // Build prompt using centralized prompt builder
    const prompt = buildPrompt(this.modelId, context);

    return {
      prompt,
      images: [imageDataUrl],
      aspect_ratio: 'match_input_image',
      turbo: true,
    };
  }
}
