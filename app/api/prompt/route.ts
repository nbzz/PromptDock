import { NextRequest, NextResponse } from 'next/server';

import { StoredTemplate } from '@/lib/types';
import { parseTemplate, renderPrompt } from '@/lib/template-parser';

// GET /api/prompt — list all builtin templates, with optional search
// GET /api/prompt?id=... — get a single template by id (including builtin id)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const search = searchParams.get('search')?.toLowerCase();

  // Fetch builtin templates
  const builtinRes = await fetch(new URL('/api/builtin-templates', request.url), {
    cache: 'no-store'
  });
  const { items: builtinTemplates } = await builtinRes.json() as { items: StoredTemplate[] };

  if (id) {
    // Return single template by id
    const template = builtinTemplates.find((t) => t.id === id || t.title === id);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    const parsed = parseTemplate(template);
    return NextResponse.json({ template: parsed });
  }

  if (search) {
    const filtered = builtinTemplates.filter(
      (t) =>
        t.title.toLowerCase().includes(search) ||
        t.rawMarkdown.toLowerCase().includes(search)
    );
    const list = filtered.map((t) => ({
      id: t.id,
      title: t.title,
      source: t.source,
      variables: parseTemplate(t).variables.map((v) => ({ id: v.id, name: v.name, type: v.type, required: v.required }))
    }));
    return NextResponse.json({ items: list, total: list.length });
  }

  // Return all templates summary
  const list = builtinTemplates.map((t) => {
    const parsed = parseTemplate(t);
    return {
      id: t.id,
      title: t.title,
      description: parsed.description,
      source: t.source,
      variables: parsed.variables.map((v) => ({ id: v.id, name: v.name, type: v.type, required: v.required }))
    };
  });
  return NextResponse.json({ items: list, total: list.length });
}

// POST /api/prompt/fill — fill variables in a template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, values } = body as { id: string; values: Record<string, string> };

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    // Fetch builtin templates
    const builtinRes = await fetch(new URL('/api/builtin-templates', request.url), {
      cache: 'no-store'
    });
    const { items: builtinTemplates } = await builtinRes.json() as { items: StoredTemplate[] };

    // Find template by id or title
    const template = builtinTemplates.find(
      (t) => t.id === id || t.title === id || t.id === `builtin:${id}` || t.title === id
    );

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const parsed = parseTemplate(template);
    const rendered = renderPrompt(parsed.content, values ?? {});

    return NextResponse.json({
      rendered,
      template: {
        id: parsed.id,
        title: parsed.title,
        description: parsed.description
      }
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
