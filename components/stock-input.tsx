'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { buildStockLabel, formatStockCode, marketLabel, searchStocks } from '@/lib/stocks';
import { StockItem } from '@/lib/types';

interface StockInputProps {
  id: string;
  fieldIndex: number;
  value: string;
  stocks: StockItem[];
  placeholder?: string;
  onChange: (value: string) => void;
  onEnterNext?: () => void;
}

function marketBadgeClass(market: StockItem['market']): string {
  if (market === 'CN') {
    return 'bg-rose-100 text-rose-700';
  }

  if (market === 'HK') {
    return 'bg-blue-100 text-blue-700';
  }

  return 'bg-violet-100 text-violet-700';
}

export function StockInput({
  id,
  fieldIndex,
  value,
  stocks,
  placeholder,
  onChange,
  onEnterNext
}: StockInputProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [isComposing, setIsComposing] = useState(false);

  const results = useMemo(() => searchStocks(stocks, value, 10), [stocks, value]);

  useEffect(() => {
    setActive(0);
  }, [value]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, []);

  function selectAt(index: number) {
    const entry = results[index];
    if (!entry) {
      return;
    }

    onChange(buildStockLabel(entry.item));
    setOpen(false);
  }

  return (
    <div className="relative" ref={rootRef}>
      <input
        id={id}
        data-field-index={fieldIndex}
        value={value}
        placeholder={placeholder ?? '输入股票代码或名称，例如寒武纪，小米，nvda等'}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        autoComplete="off"
        enterKeyHint="next"
        onFocus={() => setOpen(true)}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setOpen(true);
            setActive((current) => Math.min(current + 1, Math.max(results.length - 1, 0)));
            return;
          }

          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((current) => Math.max(current - 1, 0));
            return;
          }

          if (event.key === 'Escape') {
            setOpen(false);
            return;
          }

          if (event.key === 'Enter' && !isComposing) {
            if (open && results.length > 0) {
              event.preventDefault();
              selectAt(active);
              onEnterNext?.();
              return;
            }

            onEnterNext?.();
          }
        }}
      />

      {open && results.length > 0 ? (
        <div className="absolute z-20 mt-2 max-h-80 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-soft">
          {results.map((entry, index) => (
            <button
              key={`${entry.item.market}:${entry.item.code}`}
              type="button"
              className={`w-full border-b border-slate-100 px-3 py-2.5 text-left transition last:border-b-0 ${
                index === active ? 'bg-teal-50' : 'hover:bg-slate-50'
              }`}
              onMouseEnter={() => setActive(index)}
              onClick={() => {
                selectAt(index);
              }}
            >
              <div className="truncate text-sm font-semibold text-slate-900">{entry.item.name}</div>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${marketBadgeClass(entry.item.market)}`}
                >
                  {marketLabel(entry.item.market)}
                </span>
                <span className="font-mono text-slate-500">{formatStockCode(entry.item)}</span>
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
