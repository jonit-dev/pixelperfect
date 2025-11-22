import { NextRequest, NextResponse } from 'next/server';
import { upscaleSchema } from '@/validation/upscale.schema';
import {
  ImageGenerationService,
  InsufficientCreditsError,
  AIGenerationError,
} from '@/lib/services/image-generation.service';
import { ZodError } from 'zod';

export const runtime = 'edge';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Extract authenticated user ID from middleware header
    const userId = req.headers.get('X-User-Id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await req.json();
    const validatedInput = upscaleSchema.parse(body);

    // 3. Process image with credit management
    const service = new ImageGenerationService();
    const result = await service.processImage(userId, validatedInput);

    // 4. Return successful response
    return NextResponse.json({
      imageData: result.imageData,
      creditsRemaining: result.creditsRemaining,
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle insufficient credits
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(
        {
          error: 'Payment Required',
          message: 'You have insufficient credits. Please purchase more credits to continue.',
        },
        { status: 402 }
      );
    }

    // Handle AI generation errors
    if (error instanceof AIGenerationError) {
      const status = error.finishReason === 'SAFETY' ? 422 : 500;
      return NextResponse.json(
        {
          error: 'Generation Failed',
          message: error.message,
          finishReason: error.finishReason,
        },
        { status }
      );
    }

    // Handle unexpected errors
    console.error('Upscale API Error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
