import { StockItem, StockQueryResult } from '@/lib/types';

const T2S_MAP: Record<string, string> = {
  騰: '腾',
  訊: '讯',
  長: '长',
  東: '东',
  龍: '龙',
  國: '国',
  華: '华',
  銀: '银',
  證: '证',
  券: '券',
  貿: '贸',
  業: '业',
  車: '车',
  醫: '医',
  藥: '药',
  電: '电',
  網: '网',
  雲: '云',
  資: '资',
  產: '产',
  實: '实',
  開: '开',
  發: '发',
  集: '集',
  團: '团',
  滙: '汇',
  豐: '丰',
  廣: '广',
  滬: '沪',
  深: '深',
  臺: '台',
  亞: '亚',
  馬: '马',
  風: '风',
  優: '优',
  愛: '爱',
  蘋: '苹',
  貝: '贝',
  達: '达',
  進: '进',
  音: '音',
  樂: '乐',
  麗: '丽',
  億: '亿',
  萬: '万',
  財: '财'
};

function normalizeChineseVariants(input: string): string {
  return Array.from(input)
    .map((char) => T2S_MAP[char] ?? char)
    .join('');
}

function normalizeFreeText(input: string): string {
  return normalizeChineseVariants(input)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

function normalizeCodeText(input: string): string {
  return input
    .normalize('NFKC')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function isSubsequence(query: string, target: string): { matched: boolean; span: number; first: number } {
  let targetIndex = 0;
  let first = -1;
  let last = -1;

  for (const char of query) {
    const foundAt = target.indexOf(char, targetIndex);
    if (foundAt < 0) {
      return { matched: false, span: 0, first: -1 };
    }

    if (first < 0) {
      first = foundAt;
    }

    last = foundAt;
    targetIndex = foundAt + 1;
  }

  return {
    matched: true,
    span: last - first + 1,
    first
  };
}

function getCodeTokens(item: StockItem): string[] {
  const tokens = new Set<string>();
  const upperCode = item.code.trim().toUpperCase();
  const pure = upperCode.replace(/[^A-Z0-9]/g, '');

  if (pure) {
    tokens.add(pure);
  }

  const [left, right] = upperCode.split('.');

  if (item.market === 'HK') {
    const digits = left.replace(/[^0-9]/g, '').padStart(5, '0').slice(-5);
    const shortDigits = digits.replace(/^0+/, '') || '0';
    tokens.add(digits);
    tokens.add(shortDigits);
    tokens.add(`HK${digits}`);
    tokens.add(`HK${shortDigits}`);
  }

  if (item.market === 'CN') {
    const digits = left.replace(/[^0-9]/g, '').padStart(6, '0').slice(-6);
    const exchange = (right || '').replace(/[^A-Z]/g, '');
    tokens.add(digits);
    if (exchange) {
      tokens.add(`${exchange}${digits}`);
    }
  }

  if (item.market === 'US') {
    tokens.add(upperCode.replace(/\./g, ''));
    tokens.add(left);
  }

  return [...tokens];
}

function scoreNameMatch(name: string, query: string): number {
  const normalizedName = normalizeFreeText(name);
  const normalizedQuery = normalizeFreeText(query);

  if (!normalizedName || !normalizedQuery) {
    return 0;
  }

  if (normalizedName === normalizedQuery) {
    return 1200;
  }

  if (normalizedName.startsWith(normalizedQuery)) {
    return 1020;
  }

  if (normalizedName.includes(normalizedQuery)) {
    return 860;
  }

  const sub = isSubsequence(normalizedQuery, normalizedName);
  if (!sub.matched) {
    return 0;
  }

  const compactPenalty = Math.max(sub.span - normalizedQuery.length, 0) * 18;
  const offsetPenalty = Math.max(sub.first, 0) * 8;
  const score = 760 - compactPenalty - offsetPenalty;

  return Math.max(score, 0);
}

function scoreCodeMatch(item: StockItem, query: string): number {
  const normalizedQuery = normalizeCodeText(query);
  if (!normalizedQuery) {
    return 0;
  }

  let best = 0;
  for (const token of getCodeTokens(item)) {
    if (token === normalizedQuery) {
      best = Math.max(best, 760);
      continue;
    }

    if (token.startsWith(normalizedQuery)) {
      best = Math.max(best, 620);
      continue;
    }

    if (token.includes(normalizedQuery)) {
      best = Math.max(best, 460);
    }
  }

  return best;
}

function scoreStock(item: StockItem, query: string): number {
  const nameScore = scoreNameMatch(item.name, query);
  const codeScore = scoreCodeMatch(item, query);

  if (nameScore === 0 && codeScore === 0) {
    return 0;
  }

  let score = Math.max(nameScore, codeScore);

  if (nameScore > 0 && codeScore > 0) {
    score += 40;
  }

  if (item.market === 'CN') {
    score += 1;
  }

  return score;
}

export function searchStocks(
  stocks: StockItem[],
  query: string,
  limit = 8
): StockQueryResult[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  return stocks
    .map((item) => ({
      item,
      score: scoreStock(item, trimmed)
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      const nameCompare = a.item.name.localeCompare(b.item.name, 'zh-Hans-CN');
      if (nameCompare !== 0) {
        return nameCompare;
      }

      return a.item.code.localeCompare(b.item.code);
    })
    .slice(0, limit);
}

export function formatStockCode(item: StockItem): string {
  const upper = item.code.toUpperCase();
  const [left, right] = upper.split('.');

  if (item.market === 'HK') {
    const digits = left.replace(/[^0-9]/g, '').padStart(5, '0').slice(-5);
    const shortDigits = digits.replace(/^0+/, '') || '0';
    return `HK${shortDigits}`;
  }

  if (item.market === 'CN') {
    const digits = left.replace(/[^0-9]/g, '').padStart(6, '0').slice(-6);
    const exchange = (right || '').replace(/[^A-Z]/g, '');
    return exchange ? `${exchange}${digits}` : digits;
  }

  return left || upper;
}

export function buildStockLabel(item: StockItem): string {
  return `${item.name}，${formatStockCode(item)}`;
}

export function marketLabel(market: StockItem['market']): string {
  if (market === 'CN') {
    return 'A股';
  }

  if (market === 'HK') {
    return '港股';
  }

  return '美股';
}

export function createClientFallbackStocks(): StockItem[] {
  return [
    {
      code: '00700.HK',
      name: '腾讯控股',
      market: 'HK',
      aliases: ['腾讯', '00700', 'HK00700', '700']
    },
    {
      code: '09988.HK',
      name: '阿里巴巴-W',
      market: 'HK',
      aliases: ['阿里', '09988', 'HK09988', '9988']
    },
    {
      code: '600519.SH',
      name: '贵州茅台',
      market: 'CN',
      aliases: ['茅台', '600519', 'SH600519']
    },
    {
      code: '000001.SZ',
      name: '平安银行',
      market: 'CN',
      aliases: ['平安银行', '000001', 'SZ000001']
    },
    {
      code: 'AAPL',
      name: 'Apple Inc.',
      market: 'US',
      aliases: ['APPLE', 'AAPL']
    },
    {
      code: 'BABA',
      name: 'Alibaba Group Holding Limited',
      market: 'US',
      aliases: ['ALIBABA', 'BABA']
    }
  ];
}
