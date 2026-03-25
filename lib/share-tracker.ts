// Share count tracking for templates

const SHARE_COUNT_KEY = 'promptpage.share-counts.v1';

interface ShareCounts {
  [templateId: string]: number;
}

export function loadShareCounts(): ShareCounts {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(SHARE_COUNT_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return {};
    }

    return parsed as ShareCounts;
  } catch {
    return {};
  }
}

export function saveShareCounts(counts: ShareCounts): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SHARE_COUNT_KEY, JSON.stringify(counts));
}

export function incrementShareCount(templateId: string): number {
  const counts = loadShareCounts();
  const current = counts[templateId] ?? 0;
  const next = current + 1;
  counts[templateId] = next;
  saveShareCounts(counts);
  return next;
}

export function getShareCount(templateId: string): number {
  const counts = loadShareCounts();
  return counts[templateId] ?? 0;
}
