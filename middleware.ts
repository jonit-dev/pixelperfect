import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PUBLIC_API_ROUTES } from '@shared/config/security';
import { serverEnv } from '@shared/config/env';
import {
  applySecurityHeaders,
  applyCorsHeaders,
  handleOptionsRequest,
  applyPublicRateLimit,
  applyUserRateLimit,
  verifyApiAuth,
  addUserContextHeaders,
  handlePageAuth,
} from '@lib/middleware';

/**
 * Handle WWW to non-WWW redirect for SEO consistency
 * Redirects www.myimageupscaler.com to myimageupscaler.com
 */
function handleWWWRedirect(req: NextRequest): NextResponse | null {
  const hostname = req.nextUrl.hostname;

  // If hostname starts with www., redirect to non-www version
  if (hostname.startsWith('www.')) {
    const url = req.nextUrl.clone();
    url.protocol = req.nextUrl.protocol;
    url.hostname = hostname.slice(4); // Remove 'www.' prefix
    return NextResponse.redirect(url, 301); // Permanent redirect for SEO
  }

  return null;
}

/**
 * Legacy URL redirects for SEO
 * Maps old/incorrect URLs to their new canonical locations
 */
function handleLegacyRedirects(req: NextRequest): NextResponse | null {
  const pathname = req.nextUrl.pathname;
  const trailingSlashRemoved =
    pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;

  const redirectMap: Record<string, string> = {
    '/tools/bulk-image-resizer': '/tools/resize/bulk-image-resizer',
    '/tools/bulk-image-compressor': '/tools/compress/bulk-image-compressor',
  };

  const newPathname = redirectMap[trailingSlashRemoved];

  if (newPathname) {
    const url = req.nextUrl.clone();
    url.pathname = newPathname;
    return NextResponse.redirect(url, 301); // Permanent redirect for SEO
  }

  return null;
}

/**
 * Check if a route matches any public API route pattern
 * Handles both with and without trailing slashes
 */
function isPublicApiRoute(pathname: string): boolean {
  // Normalize pathname by removing trailing slash for comparison
  const normalizedName =
    pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;

  const result = PUBLIC_API_ROUTES.some(route => {
    if (route.endsWith('/*')) {
      const prefix = route.slice(0, -2);
      return pathname.startsWith(prefix);
    }
    // Check both exact match and match with trailing slash
    return pathname === route || normalizedName === route;
  });

  return result;
}

/**
 * Handle API route authentication and rate limiting
 */
async function handleApiRoute(req: NextRequest, pathname: string): Promise<NextResponse> {
  // Handle OPTIONS preflight requests
  const optionsResponse = handleOptionsRequest(req);
  if (optionsResponse) {
    applySecurityHeaders(optionsResponse);
    return optionsResponse;
  }

  // Check if route is public
  const isPublic = isPublicApiRoute(pathname);

  // Debug logging for test environment
  if (serverEnv.ENV === 'test' && pathname === '/api/health') {
    console.log(`[middleware] /api/health - isPublic: ${isPublic}, pathname: ${pathname}`);
  }

  // Handle public routes - they don't require authentication
  if (isPublic) {
    const res = NextResponse.next();
    applySecurityHeaders(res);
    applyCorsHeaders(res, req.headers.get('origin') || undefined);

    // Apply public rate limiting
    const rateLimitResponse = await applyPublicRateLimit(req, res);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    return res;
  }

  // Verify JWT for protected API routes
  const authResult = await verifyApiAuth(req);
  if ('error' in authResult) {
    return authResult.error;
  }

  // Create response with user context headers
  const res = addUserContextHeaders(req, authResult.user);
  applySecurityHeaders(res);
  applyCorsHeaders(res, req.headers.get('origin') || undefined);

  // Apply user-based rate limiting
  const rateLimitResponse = await applyUserRateLimit(authResult.user.id, res);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  return res;
}

/**
 * Handle page route authentication redirects
 */
async function handlePageRoute(req: NextRequest, pathname: string): Promise<NextResponse> {
  const { user, response } = await handlePageAuth(req);

  // Apply security headers
  applySecurityHeaders(response);

  // In test environment, skip auth redirects for dashboard access
  // This allows E2E tests to navigate directly to /dashboard without authentication
  const isTestEnv = serverEnv.ENV === 'test';

  // Check for test headers sent by Playwright tests
  const hasTestHeader =
    req.headers.get('x-test-env') === 'true' || req.headers.get('x-playwright-test') === 'true';

  // Authenticated user on root domain -> redirect to dashboard
  if (user && pathname === '/' && !isTestEnv && !hasTestHeader) {
    // Check if there are any query parameters that suggest other intent (like login prompts)
    const loginRequired = req.nextUrl.searchParams.get('login');

    // Only redirect if there's no login prompt to avoid conflicts with existing flow
    if (!loginRequired) {
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard';
      // Clear any existing search params for clean redirect
      url.searchParams.delete('login');
      url.searchParams.delete('next');
      return NextResponse.redirect(url);
    }
  }

  // Unauthenticated user on protected dashboard routes -> redirect to landing with login prompt
  // Skip this check in test environment or when test headers are present
  if (!user && pathname.startsWith('/dashboard') && !isTestEnv && !hasTestHeader) {
    const url = req.nextUrl.clone();
    url.pathname = '/';

    // Add query parameters to indicate login is needed and where to return after
    url.searchParams.set('login', '1');
    url.searchParams.set('next', pathname);

    return NextResponse.redirect(url);
  }

  return response;
}

/**
 * Next.js Middleware
 *
 * Responsibilities:
 * 1. Page routes: Session refresh via cookies, auth-based redirects
 * 2. API routes: JWT verification via Authorization header, rate limiting
 * 3. Security headers on all responses
 */
export async function middleware(req: NextRequest): Promise<NextResponse> {
  const pathname = req.nextUrl.pathname;

  // Handle WWW to non-WWW redirect for SEO (must be first)
  const wwwRedirect = handleWWWRedirect(req);
  if (wwwRedirect) {
    return wwwRedirect;
  }

  // Handle legacy redirects for SEO
  const legacyRedirect = handleLegacyRedirects(req);
  if (legacyRedirect) {
    return legacyRedirect;
  }

  // Route to appropriate handler
  if (pathname.startsWith('/api/')) {
    return handleApiRoute(req, pathname);
  }

  // Handle page routes
  return handlePageRoute(req, pathname);
}

/**
 * Middleware configuration
 *
 * Match all routes except:
 * - Static files (_next/static, _next/image, favicon, sitemap, robots)
 * - API routes that don't need auth (handled in middleware logic)
 */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};
