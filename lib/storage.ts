import { StoredTemplate } from '@/lib/types';

const KEY = 'promptpage.templates.v1';
const BOOKMARK_KEY = 'promptpage.bookmarks.v1';

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

// Bookmark storage (keyed by variable name, shared across templates)
export type BookmarkMap = Record<string, string>;

export function loadBookmarks(): BookmarkMap {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(BOOKMARK_KEY);
    if (!raw) {
      return {};
    }

    return JSON.parse(raw) as BookmarkMap;
  } catch {
    return {};
  }
}

export function saveBookmark(variableName: string, value: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const bookmarks = loadBookmarks();
  bookmarks[variableName] = value;
  window.localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
}

export function removeBookmark(variableName: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const bookmarks = loadBookmarks();
  delete bookmarks[variableName];
  window.localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
}
