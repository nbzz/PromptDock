import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseTemplate, renderPrompt } from './template-parser';
import { StoredTemplate } from './types';

function loadBuiltin(fileName: string): StoredTemplate {
  return {
    id: `builtin:${fileName}`,
    title: fileName.replace(/\.md$/i, ''),
    rawMarkdown: readFileSync(
      path.join(process.cwd(), 'prompts', fileName),
      'utf8'
    ),
    source: 'builtin',
    updatedAt: 0,
  };
}

describe('内置模板：30分钟投资备忘录', () => {
  const parsed = parseTemplate(loadBuiltin('30分钟投资备忘录.md'));

  it('标题取自 frontmatter', () => {
    expect(parsed.title).toBe('30分钟投资备忘录');
  });

  it('只解析出 股票名称 / 日期 两个变量，说明性方括号不会被误判', () => {
    expect(parsed.variables.map((item) => item.name)).toEqual([
      '股票名称',
      '日期',
    ]);
  });

  it('股票名称 识别为股票输入且必填', () => {
    const stock = parsed.variables.find((item) => item.name === '股票名称');
    expect(stock?.type).toBe('stock');
    expect(stock?.required).toBe(true);
  });

  it('日期 走自动填充，默认值为当天', () => {
    const date = parsed.variables.find((item) => item.name === '日期');
    expect(date?.autoFill).toBe('date');
    expect(date?.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('渲染后替换全部变量占位符', () => {
    const rendered = renderPrompt(parsed.content, {
      股票名称: '贵州茅台，SH600519',
      日期: '2026-09-23',
    });

    expect(rendered).toContain('贵州茅台，SH600519');
    expect(rendered).toContain('2026-09-23');
    expect(rendered).not.toContain('[股票名称]');
    expect(rendered).not.toContain('[日期]');
  });
});
