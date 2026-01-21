/**
 * Replicate Service Module
 *
 * Refactored Replicate service with proper separation of concerns
 */

// Main Service
export {
  ReplicateService,
  createReplicateService,
  getReplicateService,
} from '../replicate.service';

// Error
export {
  ReplicateError,
  ReplicateErrorCode,
  ReplicateErrorMapper,
  replicateErrorMapper,
  mapReplicateError,
} from './utils/error-mapper';

// Utilities
export {
  promptBuilder,
  buildPrompt,
  generateEnhancementInstructions,
} from './utils/prompt.builder';

export {
  extractUrl,
  parseReplicateOutput,
  parseReplicateResponse,
  detectMimeTypeFromUrl,
} from './utils/output-parser';

export { creditManager, CreditManager } from './utils/credit-manager';

// Builders
export {
  modelInputBuilderOrchestrator,
  buildModelInput,
  ModelInputBuilderOrchestrator,
  createModelInputContext,
} from './builders';

export type {
  IModelInput,
  IModelInputBuilder,
  IModelInputContext,
  IRealEsrganInput,
  IGfpganInput,
  IClarityUpscalerInput,
  IFluxKontextInput,
  IFlux2ProInput,
  INanoBananaProInput,
  IQwenImageEditInput,
  ISeedreamInput,
  IRealEsrganAnimeInput,
} from './builders';
