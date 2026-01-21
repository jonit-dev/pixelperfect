import type { ModelId } from '@/shared/types/coreflow.types';
import { ModelRegistry } from '../model-registry';
import { MODEL_DESCRIPTIONS, PROMPT_TEMPLATES } from './prompt-constants';

/**
 * Get model description for a given model ID
 */
function getModelDescription(id: ModelId): string | null {
  // Check predefined descriptions first
  const predefined = MODEL_DESCRIPTIONS[id as keyof typeof MODEL_DESCRIPTIONS];
  if (predefined) {
    return `${id} (${predefined.credits}x credits): ${predefined.description}`;
  }

  // Fallback: build from registry
  const registry = ModelRegistry.getInstance();
  const model = registry.getModel(id);
  if (!model) return null;

  const caps = model.capabilities;
  const cost = model.creditMultiplier;
  const canUpscale = caps.includes('upscale');

  return `${id} (${cost}x credits): ${canUpscale ? 'Upscaler' : 'Enhancement-only'}. Capabilities: ${caps.join(', ')}.`;
}

/**
 * Categorize eligible models into upscalers and enhancers
 */
function categorizeModels(eligibleModelIds: ModelId[]): {
  upscalers: string[];
  enhancers: string[];
} {
  const upscalers: string[] = [];
  const enhancers: string[] = [];

  for (const id of eligibleModelIds) {
    const description = getModelDescription(id);
    if (!description) continue;

    const predefined = MODEL_DESCRIPTIONS[id as keyof typeof MODEL_DESCRIPTIONS];
    if (predefined?.canUpscale) {
      upscalers.push(description);
    } else {
      enhancers.push(description);
    }
  }

  return { upscalers, enhancers };
}

/**
 * Build the model section of the prompt
 */
function buildModelSection(upscalers: string[], enhancers: string[]): string {
  const parts: string[] = [];

  if (upscalers.length > 0) {
    parts.push(`${PROMPT_TEMPLATES.upscalingHeader}\n${upscalers.map(d => `- ${d}`).join('\n')}`);
  }
  if (enhancers.length > 0) {
    parts.push(`${PROMPT_TEMPLATES.enhancementHeader}\n${enhancers.map(d => `- ${d}`).join('\n')}`);
  }

  return parts.join('\n\n');
}

/**
 * Build the analysis prompt dynamically based on eligible models
 */
export function buildAnalysisPrompt(eligibleModelIds: ModelId[]): string {
  const { upscalers, enhancers } = categorizeModels(eligibleModelIds);
  const modelSection = buildModelSection(upscalers, enhancers);
  const modelIdList = eligibleModelIds.join(', ');

  return [
    PROMPT_TEMPLATES.preamble,
    modelSection,
    '',
    PROMPT_TEMPLATES.rules,
    '',
    PROMPT_TEMPLATES.responseFormat,
    '',
    PROMPT_TEMPLATES.issueTypes,
    '',
    `VALID MODELS: ${modelIdList}`,
    '',
    PROMPT_TEMPLATES.guidelines,
  ]
    .filter(Boolean)
    .join('\n')
    .trim();
}
