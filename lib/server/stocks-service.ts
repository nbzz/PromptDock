import 'server-only';

import baseStocks from '@/data/stocks.base.json';
import deltaStocks from '@/data/stocks.delta.json';
import fallbackStocks from '@/data/stocks.fallback.json';
import meta from '@/data/stocks.meta.json';
import { StockFetchResult, StockItem } from '@/lib/types';

type MarketCode = 'CN' | 'HK' | 'US';

function dedupeStocks(items: StockItem[]): StockItem[] {
  const map = new Map<string, StockItem>();

  for (const item of items) {
    const key = `${item.market}:${item.code}`;
    const existing = map.get(key);

    if (!existing) {
      map.set(key, {
        ...item,
        aliases: [...new Set(item.aliases)]
      });
      continue;
    }

    existing.aliases = [...new Set([...existing.aliases, ...item.aliases])];

    if ((!existing.name || existing.name === existing.code) && item.name) {
      existing.name = item.name;
    }
  }

  return [...map.values()].sort((a, b) => {
    if (a.market !== b.market) {
      return a.market.localeCompare(b.market);
    }

    return a.code.localeCompare(b.code);
  });
}

function normalizeSourceStocks(items: StockItem[]): StockItem[] {
  return items
    .map((item) => ({
      ...item,
      code: item.code?.toUpperCase?.() ?? item.code,
      market: item.market,
      aliases: [...new Set(item.aliases ?? [])]
    }))
    .filter((item) => Boolean(item.code && item.name && item.market));
}

function countByMarket(items: StockItem[]): Record<MarketCode, number> {
  const counts: Record<MarketCode, number> = {
    CN: 0,
    HK: 0,
    US: 0
  };

  for (const item of items) {
    counts[item.market] += 1;
  }

  return counts;
}

function supplementMissingMarkets(items: StockItem[], fallback: StockItem[]): {
  merged: StockItem[];
  partialFallback: boolean;
} {
  const currentCounts = countByMarket(items);
  const missing = (Object.keys(currentCounts) as MarketCode[]).filter(
    (market) => currentCounts[market] === 0
  );

  if (missing.length === 0) {
    return {
      merged: items,
      partialFallback: false
    };
  }

  const supplement = fallback.filter((item) => missing.includes(item.market));

  return {
    merged: dedupeStocks([...items, ...supplement]),
    partialFallback: supplement.length > 0
  };
}

export async function fetchAllStocks(force = false): Promise<StockFetchResult> {
  void force;
  const base = normalizeSourceStocks(baseStocks as StockItem[]);
  const delta = normalizeSourceStocks(deltaStocks as StockItem[]);
  const fallback = normalizeSourceStocks(fallbackStocks as StockItem[]);

  const mergedLocal = dedupeStocks([...base, ...delta]);

  if (mergedLocal.length === 0) {
    return {
      items: fallback,
      usedFallback: true,
      partialFallback: false,
      updatedAt: new Date().toISOString(),
      marketCounts: countByMarket(fallback)
    };
  }

  const supplemented = supplementMissingMarkets(mergedLocal, fallback);

  return {
    items: supplemented.merged,
    usedFallback: false,
    partialFallback: supplemented.partialFallback,
    updatedAt: (meta as { updatedAt?: string }).updatedAt ?? new Date().toISOString(),
    marketCounts: countByMarket(supplemented.merged)
  };
}
