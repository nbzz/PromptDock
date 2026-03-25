'use client';

import { useState, useMemo } from 'react';
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

type DateGroup = 'today' | 'yesterday' | 'thisWeek' | 'older';

function getDateGroup(timestamp: number): DateGroup {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const weekAgo = today - 7 * 86400000;

  if (timestamp >= today) return 'today';
  if (timestamp >= yesterday) return 'yesterday';
  if (timestamp >= weekAgo) return 'thisWeek';
  return 'older';
}

const DATE_GROUP_LABELS: Record<DateGroup, string> = {
  today: '今天',
  yesterday: '昨天',
  thisWeek: '本周',
  older: '更早',
};

const PLATFORM_LABELS: Record<string, string> = {
  wx: '微信',
  douyin: '抖音',
  xhs: '小红书',
  wb: '微博',
  bili: 'B站',
};

function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-72 rounded-2xl bg-white p-5 shadow-lg">
        <h4 className="text-base font-semibold text-slate-800">{title}</h4>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-4 flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600"
          >
            确认清空
          </button>
        </div>
      </div>
    </div>
  );
}

export function HistoryPanel({ entries, onReuse, onClear }: HistoryPanelProps) {
  const [search, setSearch] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter((e) => e.templateTitle.toLowerCase().includes(q));
  }, [entries, search]);

  const grouped = useMemo(() => {
    const groups: Partial<Record<DateGroup, PromptHistoryEntry[]>> = {};
    for (const entry of filtered) {
      const g = getDateGroup(entry.createdAt);
      if (!groups[g]) groups[g] = [];
      groups[g]!.push(entry);
    }
    return groups;
  }, [filtered]);

  const groupOrder: DateGroup[] = ['today', 'yesterday', 'thisWeek', 'older'];

  const handleClear = () => {
    setShowConfirm(true);
  };

  const handleConfirmClear = () => {
    setShowConfirm(false);
    onClear();
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">最近使用</h3>
        {entries.length > 0 ? (
          <button
            type="button"
<<<<<<< HEAD
            onClick={onClear}
            className="text-xs text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
=======
            onClick={handleClear}
            className="text-xs text-slate-500 transition hover:text-red-500"
>>>>>>> origin/main
          >
            清空
          </button>
        ) : null}
      </div>

      {entries.length > 0 && (
        <div className="mb-3">
          <input
            type="text"
            placeholder="搜索历史记录..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:border-blue-400 focus:outline-none"
          />
        </div>
      )}

      {entries.length === 0 ? (
<<<<<<< HEAD
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
=======
        <p className="text-xs text-slate-500">还没有历史记录。</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-slate-500">没有找到匹配的历史记录。</p>
      ) : (
        <div className="space-y-4">
          {groupOrder.map((groupKey) => {
            const items = grouped[groupKey];
            if (!items || items.length === 0) return null;
            return (
              <div key={groupKey}>
                <p className="mb-1.5 text-xs font-medium text-slate-400">
                  {DATE_GROUP_LABELS[groupKey]}
                </p>
                <div className="space-y-1.5">
                  {items.map((entry) => (
                    <div
                      key={entry.id}
                      className="group relative rounded-xl border border-slate-200 px-3 py-2 transition hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {entry.templateTitle}
                          </p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                            <span>{formatTime(entry.createdAt)}</span>
                            {entry.platformKey && (
                              <span className="rounded bg-slate-100 px-1 py-0.5 text-slate-500">
                                {PLATFORM_LABELS[entry.platformKey] ?? entry.platformKey}
                              </span>
                            )}
                            <span>
                              {entry.action === 'copy_only' ? '仅复制' : '复制并打开'}
                            </span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onReuse(entry)}
                          className="shrink-0 rounded-lg bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 opacity-0 transition group-hover:opacity-100 hover:bg-blue-100"
                        >
                          复用
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
>>>>>>> origin/main
        </div>
      )}

      {showConfirm && (
        <ConfirmDialog
          title="清空历史记录"
          message="确定要清空所有历史记录吗？此操作不可恢复。"
          onConfirm={handleConfirmClear}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </section>
  );
}
