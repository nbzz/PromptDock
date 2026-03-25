'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'pwa-install-state';

export interface InstallState {
  promptedCount: number;
  dismissed: boolean;
  installed: boolean;
}

function loadState(): InstallState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as InstallState;
    }
  } catch {
    // ignore
  }
  return { promptedCount: 0, dismissed: false, installed: false };
}

function saveState(state: InstallState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [state, setState] = useState<InstallState>({ promptedCount: 0, dismissed: false, installed: false });
  const [visible, setVisible] = useState(false);
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const loaded = loadState();
    setState(loaded);

    if (isStandalone() || loaded.installed) {
      setState((prev) => ({ ...prev, installed: true }));
      return;
    }

    if (!loaded.dismissed || loaded.promptedCount > 0) {
      const timer = window.setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Expose a global trigger for the button in header
  useEffect(() => {
    (window as Window & { __showInstallPrompt?: () => void }).__showInstallPrompt = () => {
      if (!state.installed) {
        setVisible(true);
      }
    };
    return () => {
      delete (window as Window & { __showInstallPrompt?: () => void }).__showInstallPrompt;
    };
  }, [state.installed]);

  async function handleInstall() {
    if (!deferredEvent) return;

    setState((prev) => {
      const next = { ...prev, promptedCount: prev.promptedCount + 1 };
      saveState(next);
      return next;
    });

    await deferredEvent.prompt();
    const choice = await deferredEvent.userChoice;
    if (choice.outcome === 'accepted') {
      setState((prev) => {
        const next = { ...prev, installed: true };
        saveState(next);
        return next;
      });
      setVisible(false);
    }
    setDeferredEvent(null);
  }

  function handleDismiss() {
    setState((prev) => {
      const next = { ...prev, dismissed: true, promptedCount: prev.promptedCount + 1 };
      saveState(next);
      return next;
    });
    setVisible(false);
  }

  if (!visible || state.installed) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-sm">
      <div className="rounded-2xl border border-teal-200 bg-white p-4 shadow-xl ring-1 ring-teal-100">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-50">
            <svg className="size-5 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12" y2="18.01" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-900">安装 PromptDock App</h3>
            <ul className="mt-1 space-y-0.5 text-xs text-slate-500">
              <li>• 更快的加载速度</li>
              <li>• 桌面一键访问</li>
              <li>• 离线可用</li>
            </ul>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="关闭"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            暂不安装
          </button>
          <button
            type="button"
            onClick={handleInstall}
            className="flex-1 rounded-xl bg-teal-600 py-2 text-xs font-medium text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!deferredEvent}
          >
            {deferredEvent ? '立即安装' : '正在检查...'}
          </button>
        </div>
      </div>
    </div>
  );
}
