'use client';

import { KeyboardEvent, useEffect, useRef, useState } from 'react';

import { StockInput } from '@/components/stock-input';
import { ParsedVariable, StockItem } from '@/lib/types';
import { addVariableSuggestion, getVariableSuggestions } from '@/lib/storage';

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

/** Extract stock name from buildStockLabel format: "贵州茅台，SH: 688256" */
function extractStockName(label: string): string {
  const idx = label.indexOf('，');
  return idx > 0 ? label.slice(0, idx) : label;
}

export function VariableForm({ variables, values, stocks, stockStatusText, onChange }: VariableFormProps) {
  // Track loaded suggestions per variable name
  const [suggestionsMap, setSuggestionsMap] = useState<Record<string, string[]>>({});
  const prevValuesRef = useRef<Record<string, string>>({});

  // Load suggestions on mount
  useEffect(() => {
    const loaded: Record<string, string[]> = {};
    for (const v of variables) {
      loaded[v.name] = getVariableSuggestions(v.name);
    }
    setSuggestionsMap(loaded);
  }, [variables]);

  // Save to history when a value changes
  useEffect(() => {
    for (const variable of variables) {
      const prev = prevValuesRef.current[variable.name];
      const current = values[variable.name] ?? '';

      if (current && current !== prev) {
        const toSave =
          variable.type === 'stock' && current.includes('，')
            ? extractStockName(current)
            : current;
        addVariableSuggestion(variable.name, toSave);

        // Update local suggestions state immediately
        setSuggestionsMap((prev) => ({
          ...prev,
          [variable.name]: [toSave, ...(prev[variable.name] ?? []).filter((v) => v !== toSave)].slice(0, 5)
        }));
      }
    }

    prevValuesRef.current = { ...values };
  }, [values, variables]);

  if (variables.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <h3 className="mb-2 text-sm font-semibold text-slate-800">变量填写</h3>
        <p className="text-base text-slate-500 sm:text-sm">这个模板没有变量，直接可用。</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="mb-3 flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <h3 className="text-sm font-semibold text-slate-800">变量填写</h3>
        {stockStatusText ? <p className="text-xs text-slate-500">{stockStatusText}</p> : null}
      </div>

      <div className="space-y-3">
        {variables.map((variable, index) => {
          const value = values[variable.name] ?? '';
          const label = variable.required ? `${variable.name} *` : variable.name;
          const suggestions = suggestionsMap[variable.name] ?? [];

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
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 sm:text-sm"
                  onKeyDown={(event) => handleEnterToNext(event, index, true)}
                  onChange={(event) => onChange(variable.name, event.target.value)}
                />
              ) : null}

              {variable.type === 'select' ? (
                <select
                  id={`var-${variable.id}`}
                  data-field-index={index}
                  value={value}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 sm:text-sm"
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
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 sm:text-sm"
                  onKeyDown={(event) => handleEnterToNext(event, index)}
                  onChange={(event) => onChange(variable.name, event.target.value)}
                />
              ) : null}

              {/* Suggestion chips */}
              {suggestions.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onChange(variable.name, s)}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : null}

              {variable.hint ? <p className="text-xs text-slate-500">{variable.hint}</p> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
