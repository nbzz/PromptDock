'use client';

import { useEffect, useState } from 'react';

import { generateQRCodeDataUrl } from '@/lib/qrcode';
import { buildShareUrl } from '@/lib/share';
import { StoredTemplate } from '@/lib/types';

interface ShareModalProps {
  template: StoredTemplate;
  onClose: () => void;
}

async function copyText(text: string): Promise<boolean> {
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

export function ShareModal({ template, onClose }: ShareModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const url = buildShareUrl(template);
    setShareUrl(url);

    void (async () => {
      const qr = await generateQRCodeDataUrl(url);
      setQrDataUrl(qr);
    })();
  }, [template]);

  async function handleCopy() {
    const ok = await copyText(shareUrl);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">分享模板</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="关闭"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {qrDataUrl ? (
          <div className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="QR Code"
              width={240}
              height={240}
              className="rounded-xl border border-slate-200"
            />
            <p className="text-center text-xs text-slate-500">
              扫描二维码<br />在手机打开此模板
            </p>
          </div>
        ) : (
          <div className="flex h-60 items-center justify-center">
            <span className="text-sm text-slate-400">生成中…</span>
          </div>
        )}

        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-slate-500">或复制链接</p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600 outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-medium text-teal-700 transition hover:bg-teal-100"
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
