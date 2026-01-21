import type { IModelInputContext } from '../model-input.types';
import type { IGfpganInput } from '../model-input.types';
import { BaseModelInputBuilder } from './base-model.builder';

/**
 * GFPGAN Model Input Builder
 *
 * Face restore / old photos model
 * Uses 'img' instead of 'image' parameter
 * Max scale is 4
 */
export class GfpganBuilder extends BaseModelInputBuilder<IGfpganInput> {
  readonly modelId = 'gfpgan';

  build(context: IModelInputContext): IGfpganInput {
    const { imageDataUrl, scale } = context;

    return {
      img: imageDataUrl, // Note: GFPGAN uses 'img' not 'image'
      scale: this.capScale(scale, 4), // GFPGAN max scale is 4
      version: 'v1.4',
    };
  }
}
