import { promises as fs } from 'node:fs';
import path from 'node:path';

import { NextResponse } from 'next/server';

import { StoredTemplate } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET() {
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

    return NextResponse.json({ items: templates });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
