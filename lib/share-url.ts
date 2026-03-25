// Encode: template ID + variable values → URL params
export function encodeShareUrl(templateId: string, values: Record<string, string>): string {
  const params = new URLSearchParams();
  params.set('t', templateId);
  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(`v_${key}`, value);
  }
  return `/app?${params.toString()}`;
}

// Decode: URL params → template ID + variable values
export function decodeShareUrl(
  search: string
): { templateId: string; values: Record<string, string> } {
  const params = new URLSearchParams(search);
  const templateId = params.get('t') ?? '';
  const values: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    if (key.startsWith('v_') && value) {
      values[key.slice(2)] = value;
    }
  }
  return { templateId, values };
}
