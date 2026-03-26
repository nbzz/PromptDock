'use client';

import Image from 'next/image';
import { useState } from 'react';

import { PLATFORMS } from '@/lib/platforms';

interface PlatformActionsProps {
  content: string;
  onAction?: (action: { type: 'copy_only' | 'copy_and_open'; platformKey?: string }) => void;
  onCopyAndOpen?: (platformKey: string, url: string) => void;
  labels?: {
    title: string;
    copyOnly: string;
    copiedNotice: string;
    copyFailedNotice: string;
    copiedAndOpenNotice: string;
    openWithoutCopyNotice: string;
  };
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

const DEFAULT_LABELS = {
  title: '快捷动作（复制并跳转）',
  copyOnly: '仅复制',
  copiedNotice: '已复制',
  copyFailedNotice: '复制失败，请手动复制',
  copiedAndOpenNotice: '已复制并跳转',
  openWithoutCopyNotice: '已跳转（复制失败）',
};

export function PlatformActions({ content, onAction, onCopyAndOpen, labels }: PlatformActionsProps) {
  const t = { ...DEFAULT_LABELS, ...labels };
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
    showNotice(ok ? t.copiedNotice : t.copyFailedNotice);
  }

  async function copyAndOpenAction(platformKey: string, url: string) {
    const ok = await copyText(content);
    window.open(url, '_blank', 'noopener,noreferrer');
    if (ok) {
      onAction?.({ type: 'copy_and_open', platformKey });
    }
    showNotice(ok ? t.copiedAndOpenNotice : t.openWithoutCopyNotice);
  }

  function handleCopyAndOpen(platformKey: string, url: string) {
    if (onCopyAndOpen) {
      onCopyAndOpen(platformKey, url);
    } else {
      void copyAndOpenAction(platformKey, url);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t.title}</h3>
        <button
          type="button"
          onClick={copyOnly}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 sm:py-1.5 sm:text-xs"
        >
          <span>{t.copyOnly}</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
        {PLATFORMS.map((platform) => (
          <button
            key={platform.key}
            type="button"
            title={`${platform.name}（复制并跳转）`}
            className="group flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-1 py-2 text-xs transition hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-teal-600 dark:hover:bg-teal-900/30 sm:text-[11px]"
            onClick={() => {
              void handleCopyAndOpen(platform.key, platform.url);
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
