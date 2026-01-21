import type { IModelInputBuilder, IModelInputContext } from '../model-input.types';

/**
 * Abstract base class for model input builders
 *
 * Provides common functionality for all model builders
 */
export abstract class BaseModelInputBuilder<T = unknown> implements IModelInputBuilder<T> {
  abstract readonly modelId: string;

  /**
   * Build the input for this model
   *
   * @param context - The build context
   * @returns The model-specific input
   */
  abstract build(context: IModelInputContext): T;

  /**
   * Cap scale at maximum value (returns 2 or 4)
   */
  protected capScale(scale: number, max: number): 2 | 4 {
    const capped = Math.min(scale, max);
    return capped === 2 ? 2 : 4;
  }

  /**
   * Get scale value (only 2 or 4 for most models)
   */
  protected getBinaryScale(scale: number): 2 | 4 {
    return scale === 2 ? 2 : 4;
  }
}
