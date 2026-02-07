import { StoredTemplate } from '@/lib/types';

const KEY = 'promptpage.templates.v1';

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
