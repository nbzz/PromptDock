import { promises as fs } from 'node:fs';
import path from 'node:path';

import { NextRequest, NextResponse } from 'next/server';

import { StoredTemplate } from '@/lib/types';

export const runtime = 'nodejs';

async function getBuiltinTemplates(): Promise<StoredTemplate[]> {
  const promptsDir = path.join(process.cwd(), 'prompts');

  try {
    const entries = await fs.readdir(promptsDir, { withFileTypes: true });
    const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.md'));

    const templates: StoredTemplate[] = [];

    for (const file of files) {
      if (file.name.toLowerCase() === 'readme.md') {
        continue;
      }

      const fullPath = path.join(promptsDir, file.name);
      const rawMarkdown = await fs.readFile(fullPath, 'utf8');

      templates.push({
        id: `builtin:${file.name}`,
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.toLowerCase().trim() ?? '';

  const templates = await getBuiltinTemplates();

  if (q) {
    const filtered = templates.filter((t) => {
      const titleMatch = t.title.toLowerCase().includes(q);
      const contentMatch = t.rawMarkdown.toLowerCase().includes(q);
      return titleMatch || contentMatch;
    });
    return NextResponse.json({ templates: filtered });
  }

  return NextResponse.json({ templates });
}
