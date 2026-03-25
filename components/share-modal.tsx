'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
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

function encodeShareUrl(templateId: string, values: Record<string, string>): string {
  const data = {
    t: templateId,
    v: values
  };
  const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
  return `${window.location.origin}/?s=${encoded}`;
}

function decodeShareUrl(encoded: string): { templateId: string; values: Record<string, string> } | null {
  try {
    const decoded = JSON.parse(decodeURIComponent(atob(encoded)));
    return { templateId: decoded.t, values: decoded.v || {} };
  } catch {
    return null;
  }
}

function generateQRCode(url: string, size = 120): string {
  // Simple QR code generation using a third-party API
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
}

export { encodeShareUrl, decodeShareUrl };

export function ShareModal({ isOpen, onClose, shareUrl }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.select();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  async function handleCopy() {
    const ok = await copyText(shareUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="share-modal-title" className="text-lg font-semibold text-slate-900">
            分享链接
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="关闭"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">分享链接</label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                copied
                  ? 'border border-teal-300 bg-teal-50 text-teal-700'
                  : 'border border-teal-400 bg-teal-500 text-white hover:bg-teal-600'
              }`}
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowQR(!showQR)}
            className="text-sm text-teal-600 underline decoration-teal-300 underline-offset-2 transition hover:text-teal-700"
          >
            {showQR ? '隐藏' : '显示'}二维码
          </button>
        </div>

        {showQR && (
          <div className="mb-4 flex justify-center">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <Image
                src={generateQRCode(shareUrl)}
                alt="分享二维码"
                width={120}
                height={120}
                className="h-[120px] w-[120px]"
                unoptimized
              />
            </div>
          </div>
        )}

        <p className="text-xs text-slate-500">
          分享当前模板和已填写的变量，其他人打开链接后可以直接使用。
        </p>
      </div>
    </div>
  );
}
