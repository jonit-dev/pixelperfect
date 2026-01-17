/**
 * Provider Adapters
 *
 * Adapter pattern implementation for AI providers with credit tracking
 * and automatic provider switching based on free tier limits.
 */

export { BaseProviderAdapter } from './base-provider-adapter';
export { ReplicateProviderAdapter, createReplicateAdapter } from './replicate.provider-adapter';
export { GeminiProviderAdapter, createGeminiAdapter } from './gemini.provider-adapter';
