import { StoredTemplate } from '@/lib/types';

const KEY = 'promptpage.templates.v1';
const BOOKMARK_KEY = 'promptpage.bookmarks.v1';

export type BookmarkMap = Record<string, string>;
export type TagMap = Record<string, string[]>; // templateId -> tags[]

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
  if (typeof window === 'undefined') return;
  const bookmarks = loadBookmarks();
  bookmarks[variableName] = value;
  window.localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
}

export function removeBookmark(variableName: string): void {
  if (typeof window === 'undefined') return;
  const bookmarks = loadBookmarks();
  delete bookmarks[variableName];
  window.localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
}

const TAG_KEY = 'promptpage.tags.v1';

export function loadTags(): TagMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(TAG_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as TagMap;
  } catch {
    return {};
  }
}

export function saveTags(tags: TagMap): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TAG_KEY, JSON.stringify(tags));
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
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 200);
}
