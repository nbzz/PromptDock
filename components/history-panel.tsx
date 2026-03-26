'use client';

import { PromptHistoryEntry } from '@/lib/types';

interface HistoryPanelProps {
  entries: PromptHistoryEntry[];
  onReuse: (entry: PromptHistoryEntry) => void;
  onClear: () => void;
  onCopyAndOpen?: (platformKey: string, url: string) => void;
  platforms?: Array<{ key: string; name: string; url: string; icon: string }>;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function HistoryPanel({ entries, onReuse, onClear, onCopyAndOpen, platforms = [] }: HistoryPanelProps) {
  function getPlatformInfo(platformKey?: string) {
    if (!platformKey) return null;
    return platforms.find((p) => p.key === platformKey) ?? null;
  }

  function handleEntryClick(entry: PromptHistoryEntry) {
    // Always restore values/template
    onReuse(entry);
    // If has platformKey and onCopyAndOpen is available, trigger copy+open
    if (entry.platformKey && onCopyAndOpen) {
      const platform = getPlatformInfo(entry.platformKey);
      if (platform) {
        onCopyAndOpen(entry.platformKey, platform.url);
      }
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">最近使用</h3>
        {entries.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-slate-500 transition hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
          >
            清空
          </button>
        ) : null}
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">还没有历史记录。</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const platform = getPlatformInfo(entry.platformKey);
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => handleEntryClick(entry)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                title={platform ? `复制并跳转到 ${platform.name}` : '点击恢复变量值'}
              >
                <div className="flex items-center gap-2">
                  <p className="flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-200">{entry.templateTitle}</p>
                  {platform && (
                    <span className="shrink-0 rounded-full border border-teal-200 bg-teal-50 px-1.5 py-0.5 text-[10px] font-medium text-teal-700 dark:border-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                      → {platform.name}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {formatTime(entry.createdAt)} · {entry.action === 'copy_only' ? '仅复制' : '复制并打开'}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
