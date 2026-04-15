/**
 * Agent API - 简洁的 Agent 友好接口
 * 支持: list, get, call, search
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { NextRequest, NextResponse } from 'next/server';

import { parseTemplate, renderPrompt } from '@/lib/template-parser';
import type { StoredTemplate } from '@/lib/types';

export const runtime = 'nodejs';

/** 加载 prompts 目录下的所有模板 */
async function loadTemplates(): Promise<StoredTemplate[]> {
  const promptsDir = path.join(process.cwd(), 'prompts');
  try {
    const entries = await fs.readdir(promptsDir, { withFileTypes: true });
    const files = entries.filter((e) => e.isFile() && e.name.endsWith('.md') && e.name.toLowerCase() !== 'readme.md');

    const templates: StoredTemplate[] = [];
    for (const file of files) {
      const fullPath = path.join(promptsDir, file.name);
      const rawMarkdown = await fs.readFile(fullPath, 'utf8');
      templates.push({
        id: file.name.replace(/\.md$/i, ''),
        title: file.name.replace(/\.md$/i, ''),
        rawMarkdown,
        source: 'builtin',
        updatedAt: Date.now()
      });
    }
    return templates;
  } catch {
    return [];
  }
}

/** GET /api/agent
 * ?action=list - 列出所有模板
 * ?action=search&q=xxx - 搜索模板
 * ?action=get&id=xxx - 获取模板详情和变量
 * ?action=call&id=xxx&var1=val1&var2=val2 - 调用模板
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const action = searchParams.get('action') || 'list';

  const templates = await loadTemplates();

  if (action === 'list') {
    return NextResponse.json({
      templates: templates.map((t) => ({ id: t.id, title: t.title }))
    });
  }

  if (action === 'search') {
    const q = searchParams.get('q')?.toLowerCase() || '';
    const filtered = templates.filter(
      (t) => t.id.toLowerCase().includes(q) || t.title.toLowerCase().includes(q)
    );
    return NextResponse.json({
      templates: filtered.map((t) => ({ id: t.id, title: t.title }))
    });
  }

  if (action === 'get') {
    const id = searchParams.get('id');
    const template = templates.find((t) => t.id === id || t.title === id);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    const parsed = parseTemplate(template);
    return NextResponse.json({
      id: parsed.id,
      title: parsed.title,
      description: parsed.description,
      variables: parsed.variables.map((v) => ({
        name: v.name,
        type: v.type,
        required: v.required
      }))
    });
  }

  if (action === 'call') {
    const id = searchParams.get('id');
    const template = templates.find((t) => t.id === id || t.title === id);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // 从 query params 提取变量值
    const values: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key !== 'action' && key !== 'id') {
        values[key] = value;
      }
    });

    const parsed = parseTemplate(template);
    const rendered = renderPrompt(parsed.content, values);

    return NextResponse.json({
      id: parsed.id,
      title: parsed.title,
      rendered
    });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
