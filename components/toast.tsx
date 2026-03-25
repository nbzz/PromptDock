'use client';

import { useEffect, useState } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-teal-400 bg-teal-50 text-teal-800',
  error: 'border-rose-400 bg-rose-50 text-rose-800',
  info: 'border-blue-400 bg-blue-50 text-blue-800'
};

const variantIcons: Record<ToastVariant, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ'
};

function Toast({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(item.id), 300);
    }, 2500);

    return () => clearTimeout(timer);
  }, [item.id, onDismiss]);

  return (
    <div
      role="alert"
      aria-live="polite"
      onClick={() => {
        setVisible(false);
        setTimeout(() => onDismiss(item.id), 300);
      }}
      className={`
        flex cursor-pointer items-center gap-2.5 rounded-xl border px-4 py-3 pr-5 shadow-soft
        transition-all duration-300 ease-out
        ${variantStyles[item.variant]}
        ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/70 text-xs font-bold">
        {variantIcons[item.variant]}
      </span>
      <span className="text-sm font-medium">{item.message}</span>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed right-4 top-4 z-50 flex flex-col gap-2" style={{ pointerEvents: 'none' }}>
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <Toast item={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
