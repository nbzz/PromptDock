import { PromptHistoryEntry } from '@/lib/types';

const KEY = 'promptpage.history.v1';
const LIMIT = 20;

export function loadHistory(): PromptHistoryEntry[] {
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

    return parsed as PromptHistoryEntry[];
  } catch {
    return [];
  }
}

export function saveHistory(items: PromptHistoryEntry[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, LIMIT)));
}

export function pushHistory(entry: PromptHistoryEntry): PromptHistoryEntry[] {
  const current = loadHistory();
  const next = [entry, ...current]
    .filter((item, index, array) => {
      const duplicateIndex = array.findIndex((candidate) => candidate.id === item.id);
      return duplicateIndex === index;
    })
    .slice(0, LIMIT);

  saveHistory(next);
  return next;
}

export function clearHistory(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(KEY);
}
