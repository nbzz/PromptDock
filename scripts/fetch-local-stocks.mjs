#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'data');

const SOURCES = {
  cn: {
    name: 'A股(沪深A股列表)',
    url: 'https://raw.githubusercontent.com/khscience/OSkhQuant/main/data/%E6%B2%AA%E6%B7%B1A%E8%82%A1_%E8%82%A1%E7%A5%A8%E5%88%97%E8%A1%A8.csv'
  },
  hk: {
    name: '港股(HK Listings)',
    url: 'https://raw.githubusercontent.com/jacktth/ga-hk_stock_info/main/hk-listings/date.json'
  },
  usTickers: {
    name: '美股Ticker全集',
    url: 'https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/main/all/all_tickers.txt'
  },
  usNames: {
    name: '美股名称映射(SEC Mirror)',
    url: 'https://raw.githubusercontent.com/LondonMarket/Global-Stock-Symbols/main/sec_company_tickers_cik.json'
  }
};

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 promptpage-github-stock-fetcher/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`request failed: ${response.status} ${url}`);
  }

  return response.text();
}

async function fetchJson(url) {
  const text = await fetchText(url);
  return JSON.parse(text);
}

function normalizeCnCode(raw) {
  const upper = String(raw || '').trim().toUpperCase();
  if (/^\d{6}\.(SH|SZ|BJ)$/.test(upper)) {
    return upper;
  }

  const digits = upper.replace(/[^0-9]/g, '').padStart(6, '0').slice(-6);
  if (!digits) return '';

  if (digits.startsWith('6') || digits.startsWith('9')) return `${digits}.SH`;
  if (digits.startsWith('8') || digits.startsWith('4')) return `${digits}.BJ`;
  return `${digits}.SZ`;
}

function normalizeHkCode(raw) {
  const digits = String(raw || '')
    .replace(/[^0-9]/g, '')
    .padStart(5, '0')
    .slice(-5);

  return digits ? `${digits}.HK` : '';
}

function normalizeUsCode(raw) {
  return String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/^[0-9]+\./, '')
    .replace(/[^A-Z.-]/g, '');
}

function aliasesFor(item) {
  const aliases = new Set();
  aliases.add(item.name);
  aliases.add(item.code);

  if (item.market === 'CN') {
    const [digits, ex] = item.code.split('.');
    aliases.add(digits);
    aliases.add(`${ex}${digits}`);
  }

  if (item.market === 'HK') {
    const digits = item.code.replace('.HK', '');
    const short = digits.replace(/^0+/, '') || '0';
    aliases.add(digits);
    aliases.add(short);
    aliases.add(`HK${digits}`);
    aliases.add(`HK${short}`);
  }

  if (item.market === 'US') {
    aliases.add(item.code.replace(/[-.]/g, ''));
  }

  return [...aliases].filter(Boolean);
}

function dedupe(items) {
  const map = new Map();

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
    if (a.market !== b.market) return a.market.localeCompare(b.market);
    return a.code.localeCompare(b.code);
  });
}

function parseCnCsv(text) {
  const lines = text.split(/\r?\n/);
  const items = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const cleaned = trimmed.replace(/^\uFEFF/, '');
    const comma = cleaned.indexOf(',');
    if (comma < 0) continue;

    const rawCode = cleaned.slice(0, comma).trim();
    const name = cleaned.slice(comma + 1).trim();
    const code = normalizeCnCode(rawCode);

    if (!code || !name) continue;

    const item = {
      code,
      name,
      market: 'CN',
      aliases: []
    };
    item.aliases = aliasesFor(item);
    items.push(item);
  }

  return items;
}

function parseHkJson(rows) {
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) => {
      const code = normalizeHkCode(row?.symbol);
      const name = String(row?.zhName || row?.engName || '').trim();

      if (!code || !name) {
        return null;
      }

      const item = {
        code,
        name,
        market: 'HK',
        aliases: []
      };
      item.aliases = aliasesFor(item);
      return item;
    })
    .filter(Boolean);
}

function parseUs(tickerText, usNameMapJson) {
  const lines = tickerText.split(/\r?\n/);
  const nameMap = new Map();

  for (const record of Object.values(usNameMapJson || {})) {
    const code = normalizeUsCode(record?.ticker);
    const name = String(record?.title || '').trim();
    if (!code) continue;
    if (name) {
      nameMap.set(code, name);
    }
  }

  const items = [];

  for (const line of lines) {
    const code = normalizeUsCode(line);
    if (!code) continue;

    const name = nameMap.get(code) || code;
    const item = {
      code,
      name,
      market: 'US',
      aliases: []
    };
    item.aliases = aliasesFor(item);
    items.push(item);
  }

  return items;
}

function countByMarket(items) {
  return {
    CN: items.filter((item) => item.market === 'CN').length,
    HK: items.filter((item) => item.market === 'HK').length,
    US: items.filter((item) => item.market === 'US').length
  };
}

async function main() {
  const startedAt = Date.now();

  const [cnCsv, hkJson, usTickersText, usNamesJson] = await Promise.all([
    fetchText(SOURCES.cn.url),
    fetchJson(SOURCES.hk.url),
    fetchText(SOURCES.usTickers.url),
    fetchJson(SOURCES.usNames.url)
  ]);

  const merged = dedupe([
    ...parseCnCsv(cnCsv),
    ...parseHkJson(hkJson),
    ...parseUs(usTickersText, usNamesJson)
  ]);

  if (merged.length === 0) {
    throw new Error('no stocks merged from github sources');
  }

  const counts = countByMarket(merged);

  const meta = {
    updatedAt: new Date().toISOString(),
    total: merged.length,
    counts,
    mode: 'base+delta',
    sources: SOURCES,
    fetchedInSeconds: Math.round((Date.now() - startedAt) / 1000)
  };

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(path.join(DATA_DIR, 'stocks.base.json'), JSON.stringify(merged, null, 2), 'utf8');
  await writeFile(path.join(DATA_DIR, 'stocks.delta.json'), '[]\n', 'utf8');
  await writeFile(path.join(DATA_DIR, 'stocks.meta.json'), JSON.stringify(meta, null, 2), 'utf8');

  console.log(`done: total=${meta.total}, CN=${counts.CN}, HK=${counts.HK}, US=${counts.US}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
