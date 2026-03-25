import { StoredTemplate } from '@/lib/types';

/**
 * Encode a template into a shareable URL parameter.
 * Format: base64(JSON.stringify({ id, title, rawMarkdown }))
 */
export function encodeTemplateToShareParam(template: StoredTemplate): string {
  const payload = JSON.stringify({
    id: template.id,
    title: template.title,
    rawMarkdown: template.rawMarkdown
  });
  if (typeof window !== 'undefined') {
    return btoa(encodeURIComponent(payload));
  }
  return '';
}

/**
 * Decode a share param back to a StoredTemplate.
 */
export function decodeShareParam(param: string): StoredTemplate | null {
  try {
    const payload = decodeURIComponent(atob(param));
    const data = JSON.parse(payload) as { id: string; title: string; rawMarkdown: string };
    if (!data.id || !data.rawMarkdown) {
      return null;
    }
    return {
      id: `shared:${data.id}`,
      title: data.title || 'Shared Template',
      rawMarkdown: data.rawMarkdown,
      source: 'local',
      updatedAt: Date.now()
    };
  } catch {
    return null;
  }
}

/**
 * Build the full shareable URL for a template.
 */
export function buildShareUrl(template: StoredTemplate): string {
  if (typeof window === 'undefined') {
    return '';
  }
  const encoded = encodeTemplateToShareParam(template);
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('t', encoded);
  // Remove hash
  url.hash = '';
  return url.toString();
}
