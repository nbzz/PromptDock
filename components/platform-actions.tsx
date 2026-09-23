'use client';

import Image from 'next/image';
import { useState } from 'react';

import { PLATFORMS } from '@/lib/platforms';

interface PlatformActionsProps {
  content: string;
  onAction?: (action: { type: 'copy_only' | 'copy_and_open'; platformKey?: string }) => void;
  onCopyAndOpen?: (platformKey: string, url: string) => void;
  onBeforeCopy?: () => boolean;
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

// 操作条按钮的公共尺寸，保证移动端触控目标不小于 44px
const BAR_BUTTON_CLASS =
  'flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 min-h-[52px]';

export function PlatformActions({ content, onAction, onCopyAndOpen, onBeforeCopy, labels }: PlatformActionsProps) {
  const t = { ...DEFAULT_LABELS, ...labels };
  const [notice, setNotice] = useState('');

  function showNotice(text: string) {
    setNotice(text);
    window.setTimeout(() => setNotice(''), 1800);
  }

  async function copyOnly() {
    if (onBeforeCopy && !onBeforeCopy()) return;
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
    if (onBeforeCopy && !onBeforeCopy()) return;
    if (onCopyAndOpen) {
      onCopyAndOpen(platformKey, url);
    } else {
      void copyAndOpenAction(platformKey, url);
    }
  }

  return (
    <>
      {/* 大屏（lg 及以上）：常规卡片，平台按钮铺成网格 */}
      <section className="hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-soft lg:block dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t.title}</h3>
          <button
            type="button"
            onClick={copyOnly}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 sm:min-h-0 sm:py-1.5 sm:text-xs"
          >
            <span>{t.copyOnly}</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9">
          {PLATFORMS.map((platform) => (
            <button
              key={platform.key}
              type="button"
              title={`${platform.name}（复制并跳转）`}
              className="group flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-1 py-3 text-xs transition hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-teal-600 dark:hover:bg-slate-700 sm:min-h-16 sm:py-2 sm:text-[11px]"
              onClick={() => {
                void handleCopyAndOpen(platform.key, platform.url);
              }}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 dark:bg-slate-700">
                <Image
                  src={platform.icon}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 rounded"
                  loading="lazy"
                />
              </span>
              <span className="max-w-full truncate text-slate-700 dark:text-slate-300">{platform.name}</span>
            </button>
          ))}
        </div>

        {notice ? <p className="mt-3 text-xs text-teal-700 dark:text-teal-400">{notice}</p> : null}
      </section>

      {/*
        手机 / 平板（单列布局）：固定吸底操作条。
        原来这块要多滚约 1.7 屏才能碰到，是移动端最不实用的部分；
        改成常驻屏底后，「仅复制」与平台跳转随时可点，平台按钮横向滑动。
      */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden dark:border-slate-700 dark:bg-slate-900/95">
        {notice ? (
          <p className="absolute -top-8 left-3 rounded-lg bg-teal-600 px-2.5 py-1 text-xs font-medium text-white shadow-lg">
            {notice}
          </p>
        ) : null}

        <div className="flex items-stretch gap-2 px-2 py-2">
          <button
            type="button"
            onClick={copyOnly}
            aria-label={t.copyOnly}
            className={`${BAR_BUTTON_CLASS} min-w-[56px] border-slate-300 px-2.5 text-[10px] font-medium text-slate-700 active:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:active:bg-slate-800`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span>{t.copyOnly}</span>
          </button>

          <div className="-mr-2 flex min-w-0 flex-1 items-stretch gap-1.5 overflow-x-auto pr-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.key}
                type="button"
                title={`${platform.name}（复制并跳转）`}
                onClick={() => {
                  void handleCopyAndOpen(platform.key, platform.url);
                }}
                className={`${BAR_BUTTON_CLASS} w-[60px] border-slate-200 bg-white px-1 text-[10px] text-slate-700 active:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:active:bg-slate-700`}
              >
                <Image
                  src={platform.icon}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 rounded"
                  loading="lazy"
                />
                <span className="max-w-full truncate">{platform.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
