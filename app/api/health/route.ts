import { NextResponse } from 'next/server';
import { serverEnv } from '@/config/env';

export const runtime = 'edge'; // Force edge runtime

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    region: serverEnv.CF_PAGES_URL ? 'Cloudflare' : 'Local',
  });
}
