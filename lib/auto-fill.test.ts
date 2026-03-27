import { describe, it, expect } from 'vitest';
import { executeAutoFill, inferVariableMetaByName } from './auto-fill';

describe('executeAutoFill', () => {
  const fixedDate = new Date('2024-06-15T14:30:00');

  it('fills date', () => {
    expect(executeAutoFill('date', fixedDate)).toBe('2024-06-15');
  });

  it('fills time', () => {
    expect(executeAutoFill('time', fixedDate)).toBe('14:30:00');
  });

  it('fills datetime', () => {
    expect(executeAutoFill('datetime', fixedDate)).toBe('2024-06-15 14:30:00');
  });

  it('fills weekday', () => {
    expect(executeAutoFill('weekday', fixedDate)).toBe('周六');
  });

  it('fills month', () => {
    expect(executeAutoFill('month', fixedDate)).toBe('2024-06');
  });

  it('fills quarter', () => {
    expect(executeAutoFill('quarter', fixedDate)).toBe('2024Q2');
  });

  it('fills timestamp', () => {
    expect(executeAutoFill('timestamp', fixedDate)).toBe(String(Math.floor(fixedDate.getTime() / 1000)));
  });

  it('fills trading_day on weekday (Friday)', () => {
    const friday = new Date('2024-06-14T10:00:00'); // Friday
    expect(executeAutoFill('trading_day', friday)).toBe('2024-06-14');
  });

  it('fills trading_day on Saturday (returns Friday)', () => {
    const saturday = new Date('2024-06-15T10:00:00'); // Saturday
    expect(executeAutoFill('trading_day', saturday)).toBe('2024-06-14');
  });

  it('fills trading_day on Sunday (returns Friday)', () => {
    const sunday = new Date('2024-06-16T10:00:00'); // Sunday
    expect(executeAutoFill('trading_day', sunday)).toBe('2024-06-14');
  });
});

describe('inferVariableMetaByName', () => {
  it('infers date type for 今天', () => {
    const result = inferVariableMetaByName('今天');
    expect(result.type).toBe('date');
    expect(result.autoFill).toBe('date');
  });

  it('infers time type for 时间', () => {
    const result = inferVariableMetaByName('时间');
    expect(result.type).toBe('time');
    expect(result.autoFill).toBe('time');
  });

  it('infers quarter type for 本季度', () => {
    const result = inferVariableMetaByName('本季度');
    expect(result.type).toBe('text');
    expect(result.autoFill).toBe('quarter');
  });

  it('infers stock type for 股票', () => {
    const result = inferVariableMetaByName('股票');
    expect(result.type).toBe('stock');
  });

  it('infers stock type for 标的', () => {
    const result = inferVariableMetaByName('标的');
    expect(result.type).toBe('stock');
  });

  it('infers stock type for ticker', () => {
    const result = inferVariableMetaByName('ticker');
    expect(result.type).toBe('stock');
  });

  it('returns empty for unknown names', () => {
    const result = inferVariableMetaByName('unknown_variable');
    expect(result).toEqual({});
  });

  it('trims whitespace from name', () => {
    const result = inferVariableMetaByName('  今天  ');
    expect(result.type).toBe('date');
  });
});
