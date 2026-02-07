import { NextResponse } from 'next/server';

import { fetchAllStocks } from '@/lib/server/stocks-service';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const force = searchParams.get('force') === '1';
  const result = await fetchAllStocks(force);

  return NextResponse.json({
    count: result.items.length,
    updatedAt: result.updatedAt,
    usedFallback: result.usedFallback,
    partialFallback: result.partialFallback,
    marketCounts: result.marketCounts,
    items: result.items
  });
}
