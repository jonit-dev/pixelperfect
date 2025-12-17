import { IUpscaleConfig, DEFAULT_ENHANCEMENT_SETTINGS } from '@shared/types/pixelperfect';

/**
 * Generates enhancement prompt based on selected aspects.
 * Each aspect adds specific instructions for the AI model.
 */
const generateEnhancePrompt = (config: IUpscaleConfig): string => {
  const enhancement = config.enhancement || DEFAULT_ENHANCEMENT_SETTINGS;
  const actions: string[] = [];

  if (enhancement.clarity) {
    actions.push('sharpen edges and improve overall clarity');
  }

  if (enhancement.color) {
    actions.push('balance color saturation and correct color casts for a natural look');
  }

  if (enhancement.lighting) {
    actions.push('optimize exposure levels and balance lighting for better visibility');
  }

  if (enhancement.denoise) {
    actions.push('remove sensor noise and grain while preserving details');
  }

  if (enhancement.artifacts) {
    actions.push('eliminate JPEG compression artifacts and blocky patterns');
  }

  if (enhancement.details) {
    actions.push('enhance fine textures and bring out subtle details');
  }

  // If no aspects selected, use a sensible default
  if (actions.length === 0) {
    return 'Action: Refine the image for a cleaner, more professional appearance. ';
  }

  return `Action: ${actions.join(', ')}. `;
};

export const generatePrompt = (config: IUpscaleConfig): string => {
  // Use custom prompt if in custom mode and a prompt is provided
  if (config.mode === 'custom' && config.customPrompt && config.customPrompt.trim().length > 0) {
    return config.customPrompt;
  }

  // Fallback to 'both' logic if in custom mode but empty prompt, or normal mode logic
  const effectiveMode = config.mode === 'custom' ? 'both' : config.mode;

  // Refined Prompt to avoid IMAGE_RECITATION
  // We frame this as a "Generation" and "Reconstruction" task rather than just "Restoration"
  let prompt =
    'Task: Generate a high-definition version of the provided image with significantly improved quality. ' +
    'Core Requirement: Preserve all original elements - composition, subjects, colors, style, and structure must remain unchanged. Only improve technical quality. ';

  // Mode Selection Logic
  switch (effectiveMode) {
    case 'upscale':
      prompt += `Action: Reconstruct the image at ${config.scale}x resolution (target 2K/4K). Aggressively sharpen edges and hallucinate plausible fine details to remove blur. `;
      break;
    case 'enhance':
      // Use fine-tuned enhancement prompt based on selected aspects
      prompt += generateEnhancePrompt(config);
      break;
    case 'both':
    default:
      prompt += `Action: Reconstruct the image at ${config.scale}x resolution. Simultaneously remove noise/artifacts and sharpen fine details. The output must be crisp and photorealistic. `;
      break;
  }

  // Feature Constraints
  if (config.preserveText) {
    prompt +=
      'Constraint: Text and logos MUST remain legible, straight, and spelled correctly. Sharpen the text boundaries. ';
  } else {
    prompt += 'Constraint: Prioritize visual aesthetics. ';
  }

  if (config.enhanceFace) {
    prompt +=
      "Constraint: Enhance facial features naturally (eyes, skin texture) without altering the person's identity. ";
  }

  if (config.denoise) {
    prompt += 'Constraint: Apply strong denoising to smooth out flat areas. ';
  }

  prompt += 'Output: Return ONLY the generated image.';

  return prompt;
};
