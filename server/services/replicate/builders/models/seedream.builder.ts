import { buildPrompt } from '../../utils/prompt.builder';
import type { IModelInputContext } from '../model-input.types';
import type { ISeedreamInput } from '../model-input.types';
import { BaseModelInputBuilder } from './base-model.builder';

/**
 * Seedream Model Input Builder
 *
 * Advanced image editing with strong spatial understanding
 * Uses 'image_input' array parameter (enhancement only)
 */
export class SeedreamBuilder extends BaseModelInputBuilder<ISeedreamInput> {
  readonly modelId = 'seedream';

  build(context: IModelInputContext): ISeedreamInput {
    const { imageDataUrl } = context;

    // Build prompt using centralized prompt builder
    const prompt = buildPrompt(this.modelId, context);

    return {
      prompt,
      image_input: [imageDataUrl], // Seedream uses image_input, not image
      size: '4K', // Default to 4K for best quality
    };
  }
}
