import { IUpscaleConfig, ProcessingStage } from '@shared/types/pixelperfect';
import { createClient } from '@shared/utils/supabase/client';
import { serverEnv } from '@shared/config/env';

// Extend Window interface for test environment markers
declare global {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface Window {
    playwrightTest?: boolean;
    __TEST_ENV__?: boolean;
  }
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * Get the current user's access token for API requests
 */
async function getAccessToken(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export interface IAnalyzeImageResult {
  analysis: {
    issues: Array<{ type: string; severity: string; description: string }>;
    contentType: string;
  };
  recommendation: {
    model: string;
    reason: string;
    creditCost: number;
    confidence: number;
    alternativeModel: string | null;
    alternativeCost: number | null;
  };
  enhancementPrompt: string;
  provider: 'replicate' | 'gemini' | 'fallback';
  processingTimeMs?: number;
}

export interface IProcessImageResult {
  imageData?: string; // Base64 data URL (legacy, from Gemini)
  imageUrl?: string; // Direct URL to image (from Replicate - use in <img> tag)
  creditsRemaining: number;
  creditsUsed: number;
}

/**
 * Converts an image URL to base64 by drawing it to a canvas
 * Use this when you need base64 (e.g., for download with custom filename)
 * Note: The image must be loaded in an <img> tag first to avoid CORS issues
 */
export function imageToBase64(img: HTMLImageElement, mimeType = 'image/png'): string {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL(mimeType);
}

export interface IAnalyzeImageOptions {
  allowExpensiveModels?: boolean;
}

/**
 * Analyzes an image to get model recommendation and enhancement prompt
 * Only available for paid users (auto mode restriction)
 */
export const analyzeImage = async (
  file: File,
  options: IAnalyzeImageOptions = {}
): Promise<IAnalyzeImageResult> => {
  const base64Data = await fileToBase64(file);
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('You must be logged in to use auto model selection');
  }

  const response = await fetch('/api/analyze-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      imageData: base64Data,
      mimeType: file.type || 'image/jpeg',
      allowExpensiveModels: options.allowExpensiveModels ?? false,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to analyze image');
  }

  return await response.json();
};

// Update callback type
type ProgressCallback = (progress: number, stage?: ProcessingStage) => void;

export const processImage = async (
  file: File,
  config: IUpscaleConfig,
  onProgress: ProgressCallback
): Promise<IProcessImageResult> => {
  try {
    // Stage 1: Preparing
    onProgress(10, ProcessingStage.PREPARING);
    const base64Data = await fileToBase64(file);

    let enhancementPrompt: string | undefined;
    let resolvedModel = config.selectedModel;

    // If auto mode, analyze image first to get model recommendation and enhancement prompt
    if (config.selectedModel === 'auto') {
      // Stage 2: Analyzing
      onProgress(20, ProcessingStage.ANALYZING);
      try {
        const analysis = await analyzeImage(file, {
          allowExpensiveModels: config.allowExpensiveModels ?? false,
        });
        resolvedModel = analysis.recommendation.model as typeof config.selectedModel;
        enhancementPrompt = analysis.enhancementPrompt;
        onProgress(40, ProcessingStage.ANALYZING);
      } catch (error) {
        console.warn('Image analysis failed, falling back to default model:', error);
        resolvedModel = 'real-esrgan';
        onProgress(40, ProcessingStage.ANALYZING);
      }
    } else {
      onProgress(30, ProcessingStage.PREPARING);
    }

    // Get auth token for the API request
    const accessToken = await getAccessToken();

    // Check if we're in a test environment and bypass auth for mocked tests
    const isTestEnvironment =
      (typeof window !== 'undefined' &&
        window.location.hostname === 'localhost' &&
        serverEnv.ENV === 'test') ||
      // Check for Playwright test marker
      window.playwrightTest === true ||
      // Check for test environment variable (injected by Playwright)
      window.__TEST_ENV__ === true;

    if (!accessToken && !isTestEnvironment) {
      throw new Error('You must be logged in to process images');
    }

    // Stage 3: Enhancing (main API call)
    onProgress(50, ProcessingStage.ENHANCING);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Authorization header only if we have a token
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch('/api/upscale', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        imageData: base64Data,
        mimeType: file.type || 'image/jpeg',
        // Pass enhancement prompt if available from analysis
        enhancementPrompt,
        config: {
          ...config,
          // Use resolved model instead of 'auto'
          selectedModel: resolvedModel,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process image');
    }

    // Stage 4: Finalizing
    onProgress(95, ProcessingStage.FINALIZING);

    const data = await response.json();

    // Validate we got image data in some form
    if (!data.imageUrl && !data.imageData) {
      throw new Error('No image data received from server');
    }

    onProgress(100, ProcessingStage.FINALIZING);

    // Return both URL and base64 - consumer decides which to use
    // imageUrl: Direct URL for <img> display (no CORS issues, faster)
    // imageData: Base64 for legacy support or when base64 is needed
    return {
      imageUrl: data.imageUrl,
      imageData: data.imageData,
      creditsRemaining: data.processing?.creditsRemaining ?? 0,
      creditsUsed: data.processing?.creditsUsed ?? 0,
    };
  } catch (error) {
    console.error('AI Processing Error:', error);
    throw error;
  }
};

export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
