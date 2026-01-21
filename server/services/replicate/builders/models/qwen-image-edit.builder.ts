import { buildPrompt } from '../../utils/prompt.builder';
import type { IModelInputContext } from '../model-input.types';
import type { IQwenImageEditInput } from '../model-input.types';
import { BaseModelInputBuilder } from './base-model.builder';

/**
 * Qwen Image Edit Model Input Builder
 *
 * Budget image editing model - enhancement only (no upscaling support)
 * Uses 'image' array parameter
 */
export class QwenImageEditBuilder extends BaseModelInputBuilder<IQwenImageEditInput> {
  readonly modelId = 'qwen-image-edit';

  build(context: IModelInputContext): IQwenImageEditInput {
    const { imageDataUrl } = context;

    // Build prompt using centralized prompt builder
    const prompt = buildPrompt(this.modelId, context);

    return {
      prompt,
      image: [imageDataUrl],
      aspect_ratio: 'match_input_image',
      output_format: 'png',
      output_quality: 95,
      go_fast: true,
    };
  }
}
