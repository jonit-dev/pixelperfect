import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { clientEnv } from '@shared/config/env';
import { updateSession } from '@shared/utils/supabase/middleware';

/**
 * Verify JWT token for API routes
 * Returns the user if authenticated, or an error response
 */
export async function verifyApiAuth(
  req: NextRequest
): Promise<{ user: { id: string; email?: string } } | { error: NextResponse }> {
  if (!clientEnv.SUPABASE_URL || !clientEnv.SUPABASE_ANON_KEY) {
    console.error('Missing Supabase environment variables');
    return {
      error: NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Server configuration error',
          },
        },
        { status: 500 }
      ),
    };
  }

  // Create Supabase client for API auth (uses Authorization header)
  const supabase = createClient(clientEnv.SUPABASE_URL, clientEnv.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: req.headers.get('Authorization') ?? '',
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Valid authentication token required',
          },
        },
        { status: 401 }
      ),
    };
  }

  return { user: { id: user.id, email: user.email } };
}

/**
 * Add user context headers to request for downstream route handlers
 */
export function addUserContextHeaders(
  req: NextRequest,
  user: { id: string; email?: string }
): NextResponse {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('X-User-Id', user.id);
  requestHeaders.set('X-User-Email', user.email ?? '');

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

/**
 * Handle page route authentication
 * Refreshes session and returns user if authenticated
 */
export async function handlePageAuth(req: NextRequest): Promise<{
  user: { id: string; email?: string } | null;
  response: NextResponse;
}> {
  const { user, supabaseResponse } = await updateSession(req);

  return {
    user: user ? { id: user.id, email: user.email } : null,
    response: supabaseResponse,
  };
}
