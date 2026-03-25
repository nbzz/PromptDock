/**
 * Anonymous usage analytics - all data stored locally in localStorage.
 * No external services, no personal data.
 */

export interface UsageEntry {
  templateId: string;
  usedAt: number;
}

interface AnalyticsData {
  usage: UsageEntry[];
  promptsGenerated: number;
}

const STORAGE_KEY = 'promptdock-usage';

function createInitialData(): AnalyticsData {
  return {
    usage: [],
    promptsGenerated: 0
  };
}

function loadData(): AnalyticsData {
  if (typeof window === 'undefined') {
    return createInitialData();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialData();
    const parsed = JSON.parse(raw);
    return {
      usage: Array.isArray(parsed.usage) ? parsed.usage : [],
      promptsGenerated: typeof parsed.promptsGenerated === 'number' ? parsed.promptsGenerated : 0
    };
  } catch {
    return createInitialData();
  }
}

function saveData(data: AnalyticsData): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Record that a template was used (selected/applied). */
export function trackTemplateUsage(templateId: string): void {
  const data = loadData();
  data.usage.push({ templateId, usedAt: Date.now() });
  // Keep last 500 entries to avoid unbounded growth
  if (data.usage.length > 500) {
    data.usage = data.usage.slice(-500);
  }
  saveData(data);
}

/** Record that a prompt was generated (copy or copy+open action). */
export function trackPromptGenerated(): void {
  const data = loadData();
  data.promptsGenerated += 1;
  saveData(data);
}

/** Get total prompts generated count. */
export function getPromptsGeneratedCount(): number {
  return loadData().promptsGenerated;
}

/** Get usage count (total times any template was used). */
export function getUsageCount(): number {
  return loadData().usage.length;
}

export interface TopTemplate {
  templateId: string;
  count: number;
}

/** Get top N most-used templates. */
export function getTopTemplates(n = 5): TopTemplate[] {
  const data = loadData();
  const counts = new Map<string, number>();
  for (const entry of data.usage) {
    counts.set(entry.templateId, (counts.get(entry.templateId) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([templateId, count]) => ({ templateId, count }));
}
