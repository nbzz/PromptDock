import { describe, it, expect } from 'vitest';
import {
  extractVariableNames,
  parseTemplate,
  renderPrompt,
  renderPromptSegments,
} from './template-parser';

describe('extractVariableNames', () => {
  it('extracts simple variable names', () => {
    const result = extractVariableNames('Hello [name], welcome to [company]');
    expect(result).toEqual(['name', 'company']);
  });

  it('extracts Chinese variable names', () => {
    const result = extractVariableNames('分析 [股票] 的 [财务指标]');
    expect(result).toEqual(['股票', '财务指标']);
  });

  it('deduplicates repeated variables', () => {
    const result = extractVariableNames('[name] and [name] again');
    expect(result).toEqual(['name']);
  });

  it('ignores code blocks', () => {
    const result = extractVariableNames('Hello [name]\n```\n[ignored]\n```\nBye [name]');
    expect(result).toEqual(['name']);
  });

  it('ignores inline code', () => {
    const result = extractVariableNames('Hello `[name]` and [name]');
    expect(result).toEqual(['name']);
  });

  it('ignores known ignore list (google_search)', () => {
    const result = extractVariableNames('Search: [google_search] and [name]');
    expect(result).toEqual(['name']);
  });

  it('returns empty for no variables', () => {
    const result = extractVariableNames('No variables here');
    expect(result).toEqual([]);
  });
});

describe('parseTemplate', () => {
  it('parses frontmatter with title and variables', () => {
    const input = {
      id: 'test-1',
      title: 'Test Template',
      rawMarkdown: `---
title: My Template
description: A test template
variables:
  - id: name
    type: text
    required: true
---
Hello [name], welcome to [company]`,
      source: 'builtin' as const,
      updatedAt: Date.now(),
    };

    const result = parseTemplate(input);
    expect(result.title).toBe('My Template');
    expect(result.description).toBe('A test template');
    expect(result.variables).toHaveLength(2);
    expect(result.variables.find((v) => v.name === 'name')?.required).toBe(true);
    expect(result.variables.find((v) => v.name === 'company')?.type).toBe('text');
  });

  it('detects title from content when not in frontmatter', () => {
    const input = {
      id: 'test-2',
      title: '',
      rawMarkdown: '# My Awesome Template\n\nHello [world]',
      source: 'builtin' as const,
      updatedAt: Date.now(),
    };

    const result = parseTemplate(input);
    expect(result.title).toBe('My Awesome Template');
  });

  it('falls back to "未命名模板" when no title', () => {
    const input = {
      id: 'test-3',
      title: '',
      rawMarkdown: 'No title here [var]',
      source: 'builtin' as const,
      updatedAt: Date.now(),
    };

    const result = parseTemplate(input);
    expect(result.title).toBe('未命名模板');
  });

  it('uses frontmatter variable meta to override inferred types', () => {
    const input = {
      id: 'test-4',
      title: 'Stock Template',
      rawMarkdown: `---
variables:
  - id: 股票
    type: stock
    required: true
---
分析 [股票] 的情况`,
      source: 'builtin' as const,
      updatedAt: Date.now(),
    };

    const result = parseTemplate(input);
    const stockVar = result.variables.find((v) => v.name === '股票');
    expect(stockVar?.type).toBe('stock');
    expect(stockVar?.required).toBe(true);
  });
});

describe('renderPrompt', () => {
  it('replaces variables with values', () => {
    const content = 'Hello [name], today is [date]';
    const values = { name: 'Alice', date: '2024-01-01' };
    expect(renderPrompt(content, values)).toBe('Hello Alice, today is 2024-01-01');
  });

  it('keeps unreplaced variables as placeholders', () => {
    const content = 'Hello [name], you are [age] years old';
    const values = { name: 'Bob' };
    expect(renderPrompt(content, values)).toBe('Hello Bob, you are [age] years old');
  });

  it('handles empty values', () => {
    const content = 'Hello [name]';
    const values = { name: '' };
    expect(renderPrompt(content, values)).toBe('Hello [name]');
  });
});

describe('renderPromptSegments', () => {
  it('marks filled segments correctly', () => {
    const content = 'Hello [name], you are [age]';
    const values = { name: 'Bob' };
    const segments = renderPromptSegments(content, values);

    // Expect 4 segments: text before, filled var, text between, unfilled var
    const texts = segments.map((s) => s.text);
    expect(texts.join('')).toBe('Hello Bob, you are [age]');
    const filledSeg = segments.find((s) => s.isFilled);
    expect(filledSeg?.text).toBe('Bob');
    expect(filledSeg?.variableName).toBe('name');
  });

  it('handles all filled variables', () => {
    const content = '[greeting] [name]';
    const values = { greeting: 'Hi', name: 'there' };
    const segments = renderPromptSegments(content, values);

    expect(segments).toHaveLength(3);
    expect(segments[0].text).toBe('Hi');
    expect(segments[0].isFilled).toBe(true);
    expect(segments[1].text).toBe(' ');
    expect(segments[2].text).toBe('there');
    expect(segments[2].isFilled).toBe(true);
  });
});
