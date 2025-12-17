import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Proxy endpoint for downloading images from external URLs (e.g., Replicate)
 * This bypasses CORS restrictions that prevent direct browser fetch
 * Only used for downloads, not display (display uses img tag directly)
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Validate URL is from allowed domains (security)
  const allowedDomains = ['replicate.delivery', 'replicate.com', 'pbxt.replicate.delivery'];
  const urlObj = new URL(url);
  const isAllowed = allowedDomains.some(domain => urlObj.hostname.endsWith(domain));

  if (!isAllowed) {
    return NextResponse.json({ error: 'URL not from allowed domain' }, { status: 403 });
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const blob = await response.blob();

    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'attachment',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Proxy image error:', error);
    return NextResponse.json({ error: 'Failed to proxy image' }, { status: 500 });
  }
}
