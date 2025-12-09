import { NextResponse, NextRequest } from 'next/server';
import { SECURITY_HEADERS, buildCspHeader } from '@shared/config/security';
import { clientEnv } from '@shared/config/env';

/**
 * Allowed origins for CORS
 */
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://localhost:3000',
  clientEnv.BASE_URL,
].filter(Boolean) as string[];

/**
 * Apply security headers to a NextResponse
 * Includes standard security headers and Content Security Policy
 */
export function applySecurityHeaders(res: NextResponse): void {
  // Apply standard security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    res.headers.set(key, value);
  });

  // Apply Content Security Policy
  res.headers.set('Content-Security-Policy', buildCspHeader());
}

/**
 * Apply CORS headers to API responses
 */
export function applyCorsHeaders(res: NextResponse, origin?: string): void {
  // Set CORS headers for API responses
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // For requests without origin header, allow from anywhere
    res.headers.set('Access-Control-Allow-Origin', '*');
  }

  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.headers.set('Access-Control-Allow-Credentials', 'true');
  res.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
}

/**
 * Handle OPTIONS preflight requests
 */
export function handleOptionsRequest(req: NextRequest): NextResponse | null {
  if (req.method === 'OPTIONS') {
    const res = new NextResponse(null, { status: 200 });
    applyCorsHeaders(res, req.headers.get('origin') || undefined);
    return res;
  }
  return null;
}
