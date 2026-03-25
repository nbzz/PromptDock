'use client';

import Image from 'next/image';
import { useState } from 'react';

import { PLATFORMS } from '@/lib/platforms';
import { StoredTemplate } from '@/lib/types';

interface PlatformActionsProps {
  content: string;
  template?: StoredTemplate | null;
  onAction?: (action: { type: 'copy_only' | 'copy_and_open'; platformKey?: string }) => void;
  onShare?: (template: StoredTemplate) => void;
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

export function PlatformActions({ content, template, onAction, onShare }: PlatformActionsProps) {
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
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-800">快捷动作（复制并跳转）</h3>
        <button
          type="button"
          onClick={copyOnly}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 sm:py-1.5 sm:text-xs"
        >
          <span>仅复制</span>
        </button>
        {template && onShare ? (
          <button
            type="button"
            onClick={() => onShare(template)}
            className="inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-700 transition hover:bg-teal-100 sm:py-1.5 sm:text-xs"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            <span>二维码</span>
          </button>
        ) : null}
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
