import type { IModelInputContext } from '../model-input.types';
import type { IRealEsrganAnimeInput } from '../model-input.types';
import { BaseModelInputBuilder } from './base-model.builder';

/**
 * Real-ESRGAN Anime Model Input Builder
 *
 * Anime-specialized upscaling
 * Uses 'img' instead of 'image' parameter
 * Max scale is 4
 */
export class RealEsrganAnimeBuilder extends BaseModelInputBuilder<IRealEsrganAnimeInput> {
  readonly modelId = 'realesrgan-anime';

  build(context: IModelInputContext): IRealEsrganAnimeInput {
    const { imageDataUrl, scale, enhanceFaces } = context;

    return {
      img: imageDataUrl, // Note: uses 'img' not 'image'
      scale: this.capScale(scale, 4), // Max scale is 4
      version: 'Anime - anime6B', // Best for anime/illustrations
      face_enhance: enhanceFaces || false,
    };
  }
}
