import { StoredTemplate } from '@/lib/types';

const KEY = 'promptpage.templates.v1';
const BOOKMARK_KEY = 'promptpage.bookmarks.v1';

export type BookmarkMap = Record<string, string>;

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
