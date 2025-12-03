import { NextResponse } from 'next/server';
import { SECURITY_HEADERS, buildCspHeader } from '@shared/config/security';

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
