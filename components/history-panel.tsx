'use client';

import { PromptHistoryEntry } from '@/lib/types';

interface HistoryPanelProps {
  entries: PromptHistoryEntry[];
  onReuse: (entry: PromptHistoryEntry) => void;
  onClear: () => void;
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

export function HistoryPanel({ entries, onReuse, onClear }: HistoryPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">最近使用</h3>
        {entries.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          >
            清空
          </button>
        ) : null}
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">还没有历史记录。</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => onReuse(entry)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{entry.templateTitle}</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {formatTime(entry.createdAt)} · {entry.action === 'copy_only' ? '仅复制' : '复制并打开'}
              </p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
