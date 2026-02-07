import { NextResponse } from 'next/server';

import { fetchAllStocks } from '@/lib/server/stocks-service';

export const runtime = 'nodejs';

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return true;
  }

  const authHeader = request.headers.get('authorization');
  const xSecret = request.headers.get('x-cron-secret');

  return authHeader === `Bearer ${secret}` || xSecret === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, message: 'unauthorized' }, { status: 401 });
  }

  const result = await fetchAllStocks(true);

  return NextResponse.json({
    ok: true,
    count: result.items.length,
    updatedAt: result.updatedAt,
    usedFallback: result.usedFallback,
    partialFallback: result.partialFallback,
    marketCounts: result.marketCounts
  });
}
