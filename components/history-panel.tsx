'use client';

import { PromptHistoryEntry } from '@/lib/types';
import { useI18n } from '@/lib/i18n';

interface HistoryPanelProps {
  entries: PromptHistoryEntry[];
  onReuse: (entry: PromptHistoryEntry) => void;
  onClear: () => void;
}

function formatTime(timestamp: number, locale: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString(locale === 'en' ? 'en-US' : 'zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function HistoryPanel({ entries, onReuse, onClear }: HistoryPanelProps) {
  const { t, locale } = useI18n();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">{t('history.title')}</h3>
        {entries.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-slate-500 transition hover:text-slate-700"
          >
            {t('history.clear')}
          </button>
        ) : null}
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-slate-500">{t('history.empty')}</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => onReuse(entry)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left transition hover:bg-slate-50"
            >
              <p className="truncate text-sm font-medium text-slate-800">{entry.templateTitle}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {formatTime(entry.createdAt, locale)} · {entry.action === 'copy_only' ? t('history.copyOnly') : t('history.copyAndOpen')}
              </p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
