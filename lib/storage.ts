import { StoredTemplate } from '@/lib/types';

// All localStorage keys in one place for maintainability
export const STORAGE_KEYS = {
  TEMPLATES: 'promptpage.templates.v1',
  BOOKMARKS: 'promptpage.bookmarks.v1',
  BOOKMARK_META: 'promptpage.bookmarks.meta.v1',
  BOOKMARK_HISTORY: 'promptpage.bookmark.history.v1',
  TAGS: 'promptpage.tags.v1',
  FAVORITES: 'promptpage.favorites',
  LANG: 'lang',
  SHARE_COUNT: 'shareCount',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// Centralized localStorage helpers with error handling
export function safeGet<T>(key: StorageKey, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function safeSet(key: StorageKey, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage full or unavailable — fail silently
  }
}

export function safeRemove(key: StorageKey): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type BookmarkMap = Record<string, string>;
export type TagMap = Record<string, string[]>;

export interface BookmarkMeta {
  value: string;
  savedAt: number;
}

export type BookmarkMetaMap = Record<string, BookmarkMeta>;

export interface BookmarkHistoryEntry {
  variableName: string;
  value: string;
  filledAt: number;
}

// ─── Templates ───────────────────────────────────────────────────────────────

export function loadLocalTemplates(): StoredTemplate[] {
  return safeGet<StoredTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
}

export function saveLocalTemplates(templates: StoredTemplate[]): void {
  safeSet(STORAGE_KEYS.TEMPLATES, templates);
}

// ─── Bookmarks ───────────────────────────────────────────────────────────────

export function loadBookmarks(): BookmarkMap {
  return safeGet<BookmarkMap>(STORAGE_KEYS.BOOKMARKS, {});
}

export function loadBookmarkMeta(): BookmarkMetaMap {
  return safeGet<BookmarkMetaMap>(STORAGE_KEYS.BOOKMARK_META, {});
}

export function saveBookmark(variableName: string, value: string): void {
  const bookmarks = loadBookmarks();
  bookmarks[variableName] = value;
  safeSet(STORAGE_KEYS.BOOKMARKS, bookmarks);

  const meta = loadBookmarkMeta();
  meta[variableName] = { value, savedAt: Date.now() };
  safeSet(STORAGE_KEYS.BOOKMARK_META, meta);
}

export function removeBookmark(variableName: string): void {
  const bookmarks = loadBookmarks();
  delete bookmarks[variableName];
  safeSet(STORAGE_KEYS.BOOKMARKS, bookmarks);

  const meta = loadBookmarkMeta();
  delete meta[variableName];
  safeSet(STORAGE_KEYS.BOOKMARK_META, meta);
}

// ─── Bookmark History ─────────────────────────────────────────────────────────

const MAX_BOOKMARK_HISTORY = 50;

export function loadBookmarkHistory(): BookmarkHistoryEntry[] {
  return safeGet<BookmarkHistoryEntry[]>(STORAGE_KEYS.BOOKMARK_HISTORY, []);
}

export function addBookmarkHistoryEntry(variableName: string, value: string): void {
  const history = loadBookmarkHistory();
  const filtered = history.filter(
    (e) => !(e.variableName === variableName && e.value === value)
  );
  filtered.unshift({ variableName, value, filledAt: Date.now() });
  const trimmed = filtered.slice(0, MAX_BOOKMARK_HISTORY);
  safeSet(STORAGE_KEYS.BOOKMARK_HISTORY, trimmed);
}

export function clearBookmarkHistory(): void {
  safeRemove(STORAGE_KEYS.BOOKMARK_HISTORY);
}

// ─── Tags ───────────────────────────────────────────────────────────────────

export function loadTags(): TagMap {
  return safeGet<TagMap>(STORAGE_KEYS.TAGS, {});
}

export function saveTags(tags: TagMap): void {
  safeSet(STORAGE_KEYS.TAGS, tags);
}

export function setTemplateTags(templateId: string, tagList: string[]): void {
  const tags = loadTags();
  tags[templateId] = tagList;
  saveTags(tags);
}

export function getTemplateTags(templateId: string): string[] {
  const tags = loadTags();
  return tags[templateId] ?? [];
}

export function addTemplateTag(templateId: string, tag: string): void {
  const tags = loadTags();
  if (!tags[templateId]) tags[templateId] = [];
  if (!tags[templateId].includes(tag)) {
    tags[templateId].push(tag);
    saveTags(tags);
  }
}

export function removeTemplateTag(templateId: string, tag: string): void {
  const tags = loadTags();
  if (tags[templateId]) {
    tags[templateId] = tags[templateId].filter((t) => t !== tag);
    saveTags(tags);
  }
}

// ─── Backup ──────────────────────────────────────────────────────────────────

export interface BackupData {
  version: number;
  exportedAt: string;
  templates: StoredTemplate[];
  bookmarks: BookmarkMap;
  tags: TagMap;
}

export function exportAllData(): BackupData {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    templates: loadLocalTemplates(),
    bookmarks: loadBookmarks(),
    tags: loadTags(),
  };
}

export function downloadBackup(data: BackupData): void {
  const filename = `promptdock-backup-${data.exportedAt.slice(0, 10)}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 200);
}
