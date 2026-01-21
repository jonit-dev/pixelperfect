import type { ModelId } from '@/shared/types/coreflow.types';
import type { ILLMAnalysisResult } from './llm-image-analyzer.types';
import { OpenRouterService } from './openrouter.service';
import { buildAnalysisPrompt } from './internal/prompt-builder';
import { DEFAULT_ENHANCEMENT_PROMPT, ISSUE_TYPE_PROMPTS } from './internal/prompt-constants';

export { buildAnalysisPrompt };

export class LLMImageAnalyzer {
  private openRouter: OpenRouterService;

  constructor() {
    this.openRouter = new OpenRouterService();
  }

  async analyze(
    base64Image: string,
    mimeType: string,
    eligibleModels: ModelId[]
  ): Promise<ILLMAnalysisResult> {
    const startTime = Date.now();
    const dataUrl = this.formatDataUrl(base64Image, mimeType);

    try {
      const result = await this.analyzeWithOpenRouter(dataUrl, eligibleModels);
      return {
        ...result,
        provider: 'openrouter',
        processingTimeMs: Date.now() - startTime,
      };
    } catch {
      console.error('OpenRouter analysis failed, using default fallback');
      return {
        ...this.getDefaultResult(eligibleModels),
        provider: 'fallback',
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  private formatDataUrl(base64Image: string, mimeType: string): string {
    return base64Image.startsWith('data:') ? base64Image : `data:${mimeType};base64,${base64Image}`;
  }

  private async analyzeWithOpenRouter(
    imageDataUrl: string,
    eligibleModels: ModelId[]
  ): Promise<Omit<ILLMAnalysisResult, 'provider' | 'processingTimeMs'>> {
    const prompt = buildAnalysisPrompt(eligibleModels);
    console.log('[LLM Analyzer] OpenRouter prompt:', prompt);

    const responseText = await this.openRouter.analyzeImage(imageDataUrl, prompt);
    console.log('[LLM Analyzer] OpenRouter response:', responseText);

    const result = this.parseJsonResponse(responseText);
    return this.validateAndAdjustResult(result, eligibleModels);
  }

  private parseJsonResponse(responseText: string): ILLMAnalysisResult {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in OpenRouter response');
    }
    return JSON.parse(jsonMatch[0]);
  }

  private validateAndAdjustResult(
    result: ILLMAnalysisResult,
    eligibleModels: ModelId[]
  ): ILLMAnalysisResult {
    if (!eligibleModels.includes(result.recommendedModel)) {
      result.recommendedModel = this.findBestEligibleModel(result, eligibleModels);
      result.reasoning += ' (Adjusted for your subscription tier)';
    }

    if (!result.enhancementPrompt) {
      result.enhancementPrompt = this.generateEnhancementPrompt(result);
    }

    return result;
  }

  private findBestEligibleModel(result: ILLMAnalysisResult, eligible: ModelId[]): ModelId {
    return result.alternatives?.find(alt => eligible.includes(alt)) ?? eligible[0] ?? 'real-esrgan';
  }

  private generateEnhancementPrompt(result: ILLMAnalysisResult): string {
    const fixes = result.issues
      .filter(i => i.severity !== 'low')
      .map(i => ISSUE_TYPE_PROMPTS[i.type as keyof typeof ISSUE_TYPE_PROMPTS] ?? i.description);

    return fixes.length > 0 ? `Enhance image: ${fixes.join(', ')}` : DEFAULT_ENHANCEMENT_PROMPT;
  }

  private getDefaultResult(
    eligible: ModelId[]
  ): Omit<ILLMAnalysisResult, 'provider' | 'processingTimeMs'> {
    return {
      issues: [],
      contentType: 'photo',
      recommendedModel: eligible[0] ?? 'real-esrgan',
      reasoning: 'Standard upscaling selected (analysis unavailable).',
      confidence: 0.5,
      alternatives: eligible.slice(1, 3),
      enhancementPrompt: DEFAULT_ENHANCEMENT_PROMPT,
    };
  }
}
