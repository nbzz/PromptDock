'use client';

import { KeyboardEvent } from 'react';

import { StockInput } from '@/components/stock-input';
import { ParsedVariable, StockItem } from '@/lib/types';

interface VariableFormProps {
  variables: ParsedVariable[];
  values: Record<string, string>;
  stocks: StockItem[];
  stockStatusText?: string;
  onChange: (name: string, value: string) => void;
}

function focusNextField(index: number) {
  const fields = document.querySelectorAll<HTMLElement>('[data-field-index]');
  const next = fields[index + 1] ?? fields[fields.length - 1];
  next?.focus();
}

function handleEnterToNext(
  event: KeyboardEvent<HTMLElement>,
  index: number,
  allowShiftNewline = false
) {
  const native = event.nativeEvent as globalThis.KeyboardEvent;
  if (native.isComposing) {
    return;
  }

  if (event.key !== 'Enter') {
    return;
  }

  if (allowShiftNewline && event.shiftKey) {
    return;
  }

  event.preventDefault();
  focusNextField(index);
}

export function VariableForm({ variables, values, stocks, stockStatusText, onChange }: VariableFormProps) {
  if (variables.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <h3 className="mb-2 text-sm font-semibold text-slate-800">变量填写</h3>
        <p className="text-sm text-slate-500">这个模板没有变量，直接可用。</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-800">变量填写</h3>
        {stockStatusText ? <p className="text-[11px] text-slate-500">{stockStatusText}</p> : null}
      </div>

      <div className="space-y-3">
        {variables.map((variable, index) => {
          const value = values[variable.name] ?? '';
          const label = variable.required ? `${variable.name} *` : variable.name;

          return (
            <div key={variable.id} className="space-y-1.5">
              <label htmlFor={`var-${variable.id}`} className="text-sm font-medium text-slate-700">
                {label}
              </label>

              {variable.type === 'stock' ? (
                <StockInput
                  id={`var-${variable.id}`}
                  fieldIndex={index}
                  value={value}
                  stocks={stocks}
                  placeholder={variable.placeholder}
                  onChange={(nextValue) => onChange(variable.name, nextValue)}
                  onEnterNext={() => focusNextField(index)}
                />
              ) : null}

              {variable.type === 'textarea' ? (
                <textarea
                  id={`var-${variable.id}`}
                  data-field-index={index}
                  rows={3}
                  value={value}
                  placeholder={variable.placeholder ?? ''}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  onKeyDown={(event) => handleEnterToNext(event, index, true)}
                  onChange={(event) => onChange(variable.name, event.target.value)}
                />
              ) : null}

              {variable.type === 'select' ? (
                <select
                  id={`var-${variable.id}`}
                  data-field-index={index}
                  value={value}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  onChange={(event) => onChange(variable.name, event.target.value)}
                >
                  <option value="">请选择</option>
                  {(variable.options ?? []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : null}

              {['text', 'date', 'time', 'datetime', 'number'].includes(variable.type ?? 'text') ? (
                <input
                  id={`var-${variable.id}`}
                  data-field-index={index}
                  type={
                    variable.type === 'date'
                      ? 'date'
                      : variable.type === 'time'
                        ? 'time'
                        : variable.type === 'number'
                          ? 'number'
                          : 'text'
                  }
                  value={value}
                  enterKeyHint="next"
                  placeholder={variable.placeholder ?? ''}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  onKeyDown={(event) => handleEnterToNext(event, index)}
                  onChange={(event) => onChange(variable.name, event.target.value)}
                />
              ) : null}

              {variable.hint ? <p className="text-xs text-slate-500">{variable.hint}</p> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
