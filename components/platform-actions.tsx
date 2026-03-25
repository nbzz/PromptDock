'use client';

import Image from 'next/image';
import { useState } from 'react';

import { PLATFORMS } from '@/lib/platforms';

interface PlatformActionsProps {
  content: string;
  onAction?: (action: { type: 'copy_only' | 'copy_and_open'; platformKey?: string }) => void;
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

export function PlatformActions({ content, onAction }: PlatformActionsProps) {
  const [notice, setNotice] = useState('');

  function showNotice(text: string) {
    setNotice(text);
    window.setTimeout(() => setNotice(''), 1800);
  }

  async function copyOnly() {
    const ok = await copyText(content);
    if (ok) {
      onAction?.({ type: 'copy_only' });
    }
    showNotice(ok ? '已复制' : '复制失败，请手动复制');
  }

  async function copyAndOpen(platformKey: string, url: string) {
    const ok = await copyText(content);
    window.open(url, '_blank', 'noopener,noreferrer');
    if (ok) {
      onAction?.({ type: 'copy_and_open', platformKey });
    }
    showNotice(ok ? '已复制并跳转' : '已跳转（复制失败）');
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">快捷动作（复制并跳转）</h3>
        <button
          type="button"
          onClick={copyOnly}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 sm:py-1.5 sm:text-xs"
        >
          <span>仅复制</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
        {PLATFORMS.map((platform) => (
          <button
            key={platform.key}
            type="button"
            title={`${platform.name}（复制并跳转）`}
            className="group flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-1 py-2 text-xs transition hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-600 dark:hover:bg-teal-900/30 sm:text-[11px]"
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
            <span className="max-w-full truncate text-slate-700 dark:text-slate-300">{platform.name}</span>
          </button>
        ))}
      </div>

      {notice ? <p className="mt-3 text-xs text-teal-700 dark:text-teal-400">{notice}</p> : null}
    </section>
  );
}
