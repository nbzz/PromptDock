import { AutoFillKind, VariableType } from '@/lib/types';

function toLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toLocalTime(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function toLocalDateTime(date: Date): string {
  return `${toLocalDate(date)} ${toLocalTime(date)}`;
}

function getTradingDay(date: Date): string {
  const candidate = new Date(date);
  const day = candidate.getDay();

  if (day === 0) {
    candidate.setDate(candidate.getDate() - 2);
  }

  if (day === 6) {
    candidate.setDate(candidate.getDate() - 1);
  }

  return toLocalDate(candidate);
}

export function executeAutoFill(kind: AutoFillKind, now: Date = new Date()): string {
  if (kind === 'date') {
    return toLocalDate(now);
  }

  if (kind === 'time') {
    return toLocalTime(now);
  }

  if (kind === 'datetime') {
    return toLocalDateTime(now);
  }

  if (kind === 'weekday') {
    const map = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return map[now.getDay()];
  }

  if (kind === 'month') {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  if (kind === 'quarter') {
    const q = Math.floor(now.getMonth() / 3) + 1;
    return `${now.getFullYear()}Q${q}`;
  }

  if (kind === 'timestamp') {
    return String(Math.floor(now.getTime() / 1000));
  }

  if (kind === 'trading_day') {
    return getTradingDay(now);
  }

  return '';
}

const AUTO_FILL_BY_NAME: Record<string, { type: VariableType; autoFill: AutoFillKind }> = {
  今天: { type: 'date', autoFill: 'date' },
  今日: { type: 'date', autoFill: 'date' },
  日期: { type: 'date', autoFill: 'date' },
  当前日期: { type: 'date', autoFill: 'date' },
  current_date: { type: 'date', autoFill: 'date' },
  today: { type: 'date', autoFill: 'date' },
  时间: { type: 'time', autoFill: 'time' },
  当前时间: { type: 'time', autoFill: 'time' },
  current_time: { type: 'time', autoFill: 'time' },
  日期时间: { type: 'text', autoFill: 'datetime' },
  当前日期时间: { type: 'text', autoFill: 'datetime' },
  current_datetime: { type: 'text', autoFill: 'datetime' },
  now: { type: 'text', autoFill: 'datetime' },
  星期: { type: 'text', autoFill: 'weekday' },
  周几: { type: 'text', autoFill: 'weekday' },
  本月: { type: 'text', autoFill: 'month' },
  当前月份: { type: 'text', autoFill: 'month' },
  当前年月: { type: 'text', autoFill: 'month' },
  本季度: { type: 'text', autoFill: 'quarter' },
  当前季度: { type: 'text', autoFill: 'quarter' },
  时间戳: { type: 'text', autoFill: 'timestamp' },
  UNIX时间戳: { type: 'text', autoFill: 'timestamp' },
  Unix时间戳: { type: 'text', autoFill: 'timestamp' },
  最近交易日: { type: 'date', autoFill: 'trading_day' },
  交易日: { type: 'date', autoFill: 'trading_day' },
  最新交易日: { type: 'date', autoFill: 'trading_day' }
};

function normalizeName(name: string): string {
  return name.trim();
}

export function inferVariableMetaByName(name: string): {
  type?: VariableType;
  autoFill?: AutoFillKind;
} {
  const normalized = normalizeName(name);

  const autoFillMeta = AUTO_FILL_BY_NAME[normalized];
  if (autoFillMeta) {
    return autoFillMeta;
  }

  if (/(股票|标的|证券|ticker|symbol)/i.test(normalized)) {
    return { type: 'stock' };
  }

  return {};
}

export const AUTO_FILL_NAMES = Object.keys(AUTO_FILL_BY_NAME);
