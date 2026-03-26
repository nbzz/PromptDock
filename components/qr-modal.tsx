'use client';

import { QRCodeSVG } from 'qrcode.react';

interface QRModalProps {
  text: string;
  onClose: () => void;
}

export function QRModal({ text, onClose }: QRModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-soft dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">扫码使用模板</p>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700">
          <QRCodeSVG
            value={text}
            size={200}
            level="H"
            includeMargin
            bgColor="transparent"
          />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">截图保存</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-1 rounded-lg border border-slate-300 px-4 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          关闭
        </button>
      </div>
    </div>
  );
}
