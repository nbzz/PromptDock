import { StoredTemplate } from '@/lib/types';

const KEY = 'promptpage.templates.v1';

export interface ExportedTemplate {
  id: string;
  title: string;
  rawMarkdown: string;
  source: 'builtin' | 'local';
  updatedAt: number;
}

export function exportTemplates(templates: StoredTemplate[]): string {
  const exported: ExportedTemplate[] = templates.map((t) => ({
    id: t.id,
    title: t.title,
    rawMarkdown: t.rawMarkdown,
    source: t.source,
    updatedAt: t.updatedAt
  }));
  return JSON.stringify(exported, null, 2);
}

export function validateImportData(data: unknown): data is ExportedTemplate[] {
  if (!Array.isArray(data)) return false;
  return data.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof item.id === 'string' &&
      typeof item.title === 'string' &&
      typeof item.rawMarkdown === 'string' &&
      (item.source === 'builtin' || item.source === 'local') &&
      typeof item.updatedAt === 'number'
  );
}

export function importTemplates(
  existing: StoredTemplate[],
  incoming: ExportedTemplate[]
): { merged: StoredTemplate[]; added: number; skipped: number } {
  const existingIds = new Set(existing.map((t) => t.id));
  let added = 0;
  let skipped = 0;

  const newLocalTemplates: StoredTemplate[] = [];
  for (const item of incoming) {
    if (existingIds.has(item.id)) {
      skipped++;
      continue;
    }
    newLocalTemplates.push({
      id: item.id,
      title: item.title,
      rawMarkdown: item.rawMarkdown,
      source: item.source,
      updatedAt: item.updatedAt
    });
    added++;
  }

  const merged = [...newLocalTemplates, ...existing];
  return { merged, added, skipped };
}

export function loadLocalTemplates(): StoredTemplate[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as StoredTemplate[];
  } catch {
    return [];
  }
}

export function saveLocalTemplates(templates: StoredTemplate[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(KEY, JSON.stringify(templates));
}
