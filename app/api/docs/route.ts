import { promises as fs } from 'node:fs';
import path from 'node:path';

import { NextRequest, NextResponse } from 'next/server';

import {
  generateDocFromMarkdown,
  formatDoc,
  DocFormat,
  TemplateDoc
} from '@/lib/doc-generator';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const templateId = searchParams.get('id');
  const format = (searchParams.get('format') || 'json') as DocFormat;

  if (!templateId) {
    // Return list of all available template docs
    const promptsDir = path.join(process.cwd(), 'prompts');
    try {
      const entries = await fs.readdir(promptsDir, { withFileTypes: true });
      const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.md'));

      const docs: TemplateDoc[] = [];

      for (const file of files) {
        if (file.name.toLowerCase() === 'readme.md') {
          continue;
        }

        const fullPath = path.join(promptsDir, file.name);
        const rawMarkdown = await fs.readFile(fullPath, 'utf8');
        const id = `builtin:${file.name}`;
        const title = file.name.replace(/\.md$/i, '');
        const doc = generateDocFromMarkdown(id, rawMarkdown, title);
        docs.push(doc);
      }

      if (format === 'json') {
        return NextResponse.json({ items: docs });
      }

      // Return as formatted list
      const list = docs
        .map((d) => `- **${d.title}**${d.description ? `: ${d.description}` : ''} (id: \`${d.id}\`)`)
        .join('\n');

      const body =
        format === 'html'
          ? `<html><body><pre>${list}</pre></body></html>`
          : list;

      return new NextResponse(body, {
        headers: { 'Content-Type': 'text/plain' }
      });
    } catch {
      return NextResponse.json({ error: 'Failed to read templates' }, { status: 500 });
    }
  }

  // Get specific template doc
  const promptsDir = path.join(process.cwd(), 'prompts');

  // Parse template ID (e.g., "builtin:个股分析.md")
  let filename = templateId;
  if (filename.startsWith('builtin:')) {
    filename = filename.slice(7);
  }
  if (!filename.endsWith('.md')) {
    filename += '.md';
  }

  const fullPath = path.join(promptsDir, filename);

  try {
    const rawMarkdown = await fs.readFile(fullPath, 'utf8');
    const doc = generateDocFromMarkdown(templateId, rawMarkdown);

    if (format === 'json') {
      return NextResponse.json(doc);
    }

    const formatted = formatDoc(doc, format);
    const contentType =
      format === 'html' ? 'text/html' : 'text/markdown';

    return new NextResponse(formatted, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${doc.title}.${format}"`
      }
    });
  } catch {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }
}
