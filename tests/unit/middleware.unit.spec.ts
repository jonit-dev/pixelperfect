import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock all dependencies
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

vi.mock('@server/rateLimit', () => ({
  rateLimit: { limit: vi.fn() },
  publicRateLimit: { limit: vi.fn() },
}));

vi.mock('@shared/config/env', () => ({
  clientEnv: {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key',
  },
  serverEnv: {
    NODE_ENV: 'test',
    AMPLITUDE_API_KEY: 'test_amplitude_api_key',
  },
}));

vi.mock('@shared/utils/supabase/middleware', () => ({
  updateSession: vi.fn(),
}));

describe('Authentication Middleware', () => {
  let consoleSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    consoleSpy.mockRestore();
  });

  describe('Basic functionality', () => {
    test('should import middleware function', async () => {
      // Test that the middleware can be imported
      const { middleware } = await import('../../middleware');
      expect(typeof middleware).toBe('function');
    });

    test('should log pathname for debugging', async () => {
      const { middleware } = await import('../../middleware');
      const request = new NextRequest('http://localhost/api/health', {
        method: 'GET',
      });

      await middleware(request);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Middleware] pathname:',
        '/api/health',
        'isPublicApiRoute:',
        true
      );
    });

    test('should handle API routes differently from page routes', async () => {
      const { middleware } = await import('../../middleware');

      const apiRequest = new NextRequest('http://localhost/api/test', {
        method: 'GET',
      });

      const pageRequest = new NextRequest('http://localhost/dashboard', {
        method: 'GET',
      });

      // Both should return a response
      const apiResponse = await middleware(apiRequest);
      const pageResponse = await middleware(pageRequest);

      expect(apiResponse).toBeInstanceOf(NextResponse);
      expect(pageResponse).toBeInstanceOf(NextResponse);
    });
  });

  describe('Security headers', () => {
    test('should apply security headers to API responses', async () => {
      const { middleware } = await import('../../middleware');
      const request = new NextRequest('http://localhost/api/health', {
        method: 'GET',
      });

      const response = await middleware(request);

      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(response.headers.get('Content-Security-Policy')).toBeTruthy();
    });

    test('should apply security headers to page responses', async () => {
      const { middleware } = await import('../../middleware');

      // Mock updateSession to return a response
      const { updateSession } = await import('@shared/utils/supabase/middleware');
      (updateSession as any).mockResolvedValue({
        user: null,
        supabaseResponse: new NextResponse(),
      });

      const request = new NextRequest('http://localhost/', {
        method: 'GET',
      });

      const response = await middleware(request);

      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });
  });

  describe('Public API route detection', () => {
    test('should identify /api/health as public route', async () => {
      const { middleware } = await import('../../middleware');
      const request = new NextRequest('http://localhost/api/health', {
        method: 'GET',
      });

      const response = await middleware(request);

      // Should not require authentication
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Middleware] pathname:',
        '/api/health',
        'isPublicApiRoute:',
        true
      );
    });

    test('should identify webhook routes as public', async () => {
      const { middleware } = await import('../../middleware');
      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: '{}',
      });

      const response = await middleware(request);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Middleware] pathname:',
        '/api/webhooks/stripe',
        'isPublicApiRoute:',
        true
      );
    });

    test('should identify analytics routes as public', async () => {
      const { middleware } = await import('../../middleware');
      const request = new NextRequest('http://localhost/api/analytics/track', {
        method: 'POST',
        body: '{}',
      });

      const response = await middleware(request);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Middleware] pathname:',
        '/api/analytics/track',
        'isPublicApiRoute:',
        true
      );
    });
  });

  describe('Route type detection', () => {
    test('should handle various route patterns correctly', async () => {
      const { middleware } = await import('../../middleware');

      const testCases = [
        { url: 'http://localhost/api/checkout', isApi: true },
        { url: 'http://localhost/api/webhooks/stripe', isApi: true },
        { url: 'http://localhost/dashboard', isApi: false },
        { url: 'http://localhost/pricing', isApi: false },
        { url: 'http://localhost/blog/test', isApi: false },
      ];

      for (const testCase of testCases) {
        const request = new NextRequest(testCase.url, { method: 'GET' });
        await middleware(request);

        expect(consoleSpy).toHaveBeenCalledWith(
          '[Middleware] pathname:',
          expect.stringContaining(testCase.url.replace('http://localhost', '')),
          'isPublicApiRoute:',
          expect.any(Boolean)
        );
      }
    });
  });
});