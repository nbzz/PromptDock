'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';

import { PLATFORMS } from '@/lib/platforms';
import { ParsedTemplate } from '@/lib/types';

interface PlatformActionsProps {
  content: string;
  parsed?: ParsedTemplate | null;
  onAction?: (action: { type: 'copy_only' | 'copy_and_open'; platformKey?: string }) => void;
}

interface CopyHistoryItem {
  id: string;
  text: string;
  format: 'plain' | 'markdown';
  timestamp: number;
}

const COPY_HISTORY_KEY = 'promptdock.copy_history';
const MAX_HISTORY = 5;

function loadCopyHistory(): CopyHistoryItem[] {
  try {
    const raw = localStorage.getItem(COPY_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveCopyHistory(items: CopyHistoryItem[]): void {
  localStorage.setItem(COPY_HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
}

async function copyText(text: string): Promise<boolean> {
  if (!text.trim()) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }
}

export function PlatformActions({ content, parsed, onAction }: PlatformActionsProps) {
  const [notice, setNotice] = useState('');
  const [copyFormat, setCopyFormat] = useState<'plain' | 'markdown'>('plain');
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [copyHistory, setCopyHistory] = useState<CopyHistoryItem[]>([]);
  const formatMenuRef = useRef<HTMLDivElement>(null);
  const historyMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCopyHistory(loadCopyHistory());
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (formatMenuRef.current && !formatMenuRef.current.contains(event.target as Node)) {
        setShowFormatMenu(false);
      }
      if (historyMenuRef.current && !historyMenuRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function showToast(text: string) {
    setNotice(text);
    window.setTimeout(() => setNotice(''), 1800);
  }

  async function getMarkdownExport(): Promise<string> {
    if (!parsed) return content;
    const meta: Record<string, unknown> = {
      ...parsed.frontmatter,
      title: parsed.title,
      variables: parsed.variables.reduce<Record<string, unknown>>((acc, item) => {
        acc[item.name] = {
          type: item.type,
          required: item.required,
          default: item.value || undefined,
          placeholder: item.placeholder,
          hint: item.hint,
          options: item.options,
          autoFill: item.autoFill
        };
        return acc;
      }, {})
    };

    try {
      const yaml = (await import('js-yaml')).default as typeof import('js-yaml');
      const rawMeta = yaml.dump(meta, { lineWidth: 120, noRefs: true, sortKeys: false });
      return `---\n${rawMeta}---\n${parsed.content}`;
    } catch {
      return content;
    }
  }

  async function handleCopy() {
    const textToCopy = copyFormat === 'markdown' ? await getMarkdownExport() : content;
    const ok = await copyText(textToCopy);

    if (ok) {
      const historyItem: CopyHistoryItem = {
        id: crypto.randomUUID(),
        text: textToCopy.slice(0, 100) + (textToCopy.length > 100 ? '...' : ''),
        format: copyFormat,
        timestamp: Date.now()
      };

      const newHistory = [historyItem, ...copyHistory.filter(h => h.text !== historyItem.text)].slice(0, MAX_HISTORY);
      setCopyHistory(newHistory);
      saveCopyHistory(newHistory);

      onAction?.({ type: 'copy_only' });
      showToast(copyFormat === 'markdown' ? '已复制为 Markdown' : '已复制为纯文本');
    } else {
      showToast('复制失败，请手动复制');
    }
  }

  async function copyHistoryItem(item: CopyHistoryItem) {
    const ok = await copyText(item.text);
    if (ok) {
      onAction?.({ type: 'copy_only' });
      showToast('已复制');
    } else {
      showToast('复制失败');
    }
    setShowHistory(false);
  }

  async function copyAndOpen(platformKey: string, url: string) {
    const textToCopy = copyFormat === 'markdown' ? await getMarkdownExport() : content;
    const ok = await copyText(textToCopy);
    window.open(url, '_blank', 'noopener,noreferrer');

    if (ok) {
      const historyItem: CopyHistoryItem = {
        id: crypto.randomUUID(),
        text: textToCopy.slice(0, 100) + (textToCopy.length > 100 ? '...' : ''),
        format: copyFormat,
        timestamp: Date.now()
      };

      const newHistory = [historyItem, ...copyHistory.filter(h => h.text !== historyItem.text)].slice(0, MAX_HISTORY);
      setCopyHistory(newHistory);
      saveCopyHistory(newHistory);

      onAction?.({ type: 'copy_and_open', platformKey });
      showToast(copyFormat === 'markdown' ? '已复制为 Markdown 并跳转' : '已复制并跳转');
    } else {
      showToast('已跳转（复制失败）');
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-800">快捷动作（复制并跳转）</h3>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
            ⌘C 复制
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Copy History Dropdown */}
          <div className="relative" ref={historyMenuRef}>
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700 transition hover:bg-slate-50"
              title="复制历史"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              历史
              {copyHistory.length > 0 && (
                <span className="ml-1 rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] text-teal-700">
                  {copyHistory.length}
                </span>
              )}
            </button>

            {showHistory && (
              <div className="absolute right-0 top-full z-10 mt-1 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                <p className="mb-2 px-2 text-xs font-medium text-slate-500">最近 {MAX_HISTORY} 条复制记录</p>
                {copyHistory.length === 0 ? (
                  <p className="px-2 py-3 text-center text-xs text-slate-400">暂无复制记录</p>
                ) : (
                  <div className="space-y-1">
                    {copyHistory.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => void copyHistoryItem(item)}
                        className="w-full rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2 text-left transition hover:bg-slate-100"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">
                            {new Date(item.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={`rounded px-1 py-0.5 text-[10px] ${
                            item.format === 'markdown' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {item.format === 'markdown' ? 'Markdown' : '纯文本'}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-slate-700">{item.text}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Copy Format Dropdown */}
          <div className="relative" ref={formatMenuRef}>
            <button
              type="button"
              onClick={() => setShowFormatMenu(!showFormatMenu)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700 transition hover:bg-slate-50"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              {copyFormat === 'plain' ? '纯文本' : 'Markdown'}
              <svg className="h-3 w-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showFormatMenu && (
              <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => { setCopyFormat('plain'); setShowFormatMenu(false); }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${
                    copyFormat === 'plain' ? 'bg-teal-50 text-teal-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  纯文本
                  {copyFormat === 'plain' && <span className="ml-auto text-teal-600">✓</span>}
                </button>
                <button
                  type="button"
                  onClick={() => { setCopyFormat('markdown'); setShowFormatMenu(false); }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${
                    copyFormat === 'markdown' ? 'bg-teal-50 text-teal-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Markdown
                  {copyFormat === 'markdown' && <span className="ml-auto text-teal-600">✓</span>}
                </button>
              </div>
            )}
          </div>

          {/* Only Copy Button */}
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50 sm:py-1.5 sm:text-xs"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            <span>仅复制</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
        {PLATFORMS.map((platform) => (
          <button
            key={platform.key}
            type="button"
            title={`${platform.name}（复制并跳转）`}
            className="group flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-1 py-2 text-xs transition hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-50 sm:text-[11px]"
            onClick={() => {
              void copyAndOpen(platform.key, platform.url);
            }}
          >
            <Image
              src={platform.icon}
              alt={platform.name}
              width={24}
              height={24}
              className="h-6 w-6 rounded"
              loading="lazy"
            />
            <span className="max-w-full truncate text-slate-700">{platform.name}</span>
          </button>
        ))}
      </div>

      {notice ? <p className="mt-3 text-xs text-teal-700">{notice}</p> : null}
    </section>
  );
}
