'use client';

import { useEffect, useRef, useState } from 'react';

import { loadBookmarkMeta, removeBookmark, BookmarkMetaMap } from '@/lib/storage';

interface BookmarkPanelProps {
  onClose: () => void;
  onUpdate: () => void;
  lang: 'zh' | 'en';
}

export function BookmarkPanel({ onClose, onUpdate, lang }: BookmarkPanelProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkMetaMap>({});
  const [copiedName, setCopiedName] = useState<string | null>(null);

  useEffect(() => {
    setBookmarks(loadBookmarkMeta());
    closeButtonRef.current?.focus();

    function handleBookmarksChanged() {
      setBookmarks(loadBookmarkMeta());
    }
    window.addEventListener('bookmarks-changed', handleBookmarksChanged);
    return () => window.removeEventListener('bookmarks-changed', handleBookmarksChanged);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleDelete = (name: string) => {
    removeBookmark(name);
    setBookmarks(loadBookmarkMeta());
    onUpdate();
    // Notify VariableForm to refresh its bookmark state
    window.dispatchEvent(new CustomEvent('bookmarks-changed'));
  };

  const handleCopy = async (name: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedName(name);
      setTimeout(() => setCopiedName(null), 1500);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedName(name);
      setTimeout(() => setCopiedName(null), 1500);
    }
  };

  // Sort by savedAt descending (newest first)
  const sorted = Object.entries(bookmarks).sort(([, a], [, b]) => b.savedAt - a.savedAt);

  const labels = lang === 'zh'
    ? { title: '书签管理', empty: '暂无书签', copyTip: '点击值即可复制', close: '关闭' }
    : { title: 'Bookmark Manager', empty: 'No bookmarks yet', copyTip: 'Click value to copy', close: 'Close' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex w-[480px] max-w-[92vw] flex-col rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-900 max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{labels.title}</p>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            aria-label={labels.close}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <p className="text-sm text-slate-500 dark:text-slate-400">{labels.empty}</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {sorted.map(([name, meta]) => (
                <li
                  key={name}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{name}</p>
                    <button
                      type="button"
                      onClick={() => handleCopy(name, meta.value)}
                      className="mt-1 break-all text-sm text-left text-slate-800 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded"
                      title={labels.copyTip}
                    >
                      {copiedName === name ? (
                        <span className="text-teal-600 dark:text-teal-400 text-xs">✓ copied</span>
                      ) : meta.value}
                    </button>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(meta.savedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(name)}
                      className="ml-1 rounded-lg p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                      aria-label="Delete bookmark"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {labels.close}
          </button>
        </div>
      </div>
    </div>
  );
}
