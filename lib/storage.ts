import { StoredTemplate } from '@/lib/types';

const KEY = 'promptpage.templates.v1';
const SUGGESTIONS_KEY = 'promptpage.variable-suggestions.v1';
const MAX_SUGGESTIONS = 5;

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

export function getVariableSuggestions(variableName: string): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(SUGGESTIONS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as Record<string, string[]>;
    return parsed[variableName] ?? [];
  } catch {
    return [];
  }
}

export function addVariableSuggestion(variableName: string, value: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!value.trim()) {
    return;
  }

  try {
    const raw = window.localStorage.getItem(SUGGESTIONS_KEY);
    const current = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    const existing = current[variableName] ?? [];

    // Deduplicate and put the new value at the front
    const filtered = existing.filter((v) => v !== value);
    const updated = [value, ...filtered].slice(0, MAX_SUGGESTIONS);

    current[variableName] = updated;
    window.localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(current));
  } catch {
    // Ignore storage errors
  }
}
