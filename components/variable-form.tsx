'use client';

import { forwardRef, KeyboardEvent, useEffect, useImperativeHandle, useState } from 'react';

import { StockInput } from '@/components/stock-input';
import { BookmarkMap, loadBookmarks, removeBookmark, saveBookmark, addBookmarkHistoryEntry } from '@/lib/storage';
import { ParsedVariable, StockItem } from '@/lib/types';

interface VariableFormProps {
  variables: ParsedVariable[];
  values: Record<string, string>;
  stocks: StockItem[];
  stockStatusText?: string;
  onChange: (name: string, value: string) => void;
  labels?: {
    sectionTitle: string;
    noVariables: string;
    bookmarkFill: string;
    addBookmark: string;
    removeBookmark: string;
    selectPlaceholder?: string;
    validationFailed?: string;
  };
}

export interface VariableFormRef {
  validate: () => string[];
  clearValidation: () => void;
}

const DEFAULT_VARIABLE_FORM_LABELS = {
  sectionTitle: '变量填写',
  noVariables: '这个模板没有变量，直接可用。',
  bookmarkFill: '书签快速填充',
  addBookmark: '添加书签',
  removeBookmark: '移除书签',
  selectPlaceholder: '请选择',
  validationFailed: '请填写必填字段：',
};

// Shared field classes to avoid repetition
const FIELD_BASE =
  'w-full rounded-xl border text-base outline-none transition sm:text-sm';

const FIELD_NORMAL_CLASSES =
  'border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus-visible:border-teal-500 dark:focus-visible:ring-teal-400 focus-visible:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-200';

const FIELD_INVALID_CLASSES =
  'border-rose-400 focus-visible:border-rose-500 focus-visible:ring-rose-200 dark:border-rose-500 dark:focus-visible:border-rose-400 dark:focus-visible:ring-rose-400';

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

function BookmarkIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg className="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
    </svg>
  ) : (
    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

export const VariableForm = forwardRef<VariableFormRef, VariableFormProps>(function VariableForm({ variables, values, stocks, stockStatusText, onChange, labels }, ref) {
  const t = { ...DEFAULT_VARIABLE_FORM_LABELS, ...labels };
  const [bookmarks, setBookmarks] = useState<BookmarkMap>(() => loadBookmarks());
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());

  // Listen for bookmark changes from BookmarkPanel
  useEffect(() => {
    function handleBookmarksChanged() {
      setBookmarks(loadBookmarks());
    }
    window.addEventListener('bookmarks-changed', handleBookmarksChanged);
    return () => window.removeEventListener('bookmarks-changed', handleBookmarksChanged);
  }, []);

  useImperativeHandle(ref, () => ({
    validate: () => {
      const missing: string[] = [];
      for (const v of variables) {
        if (v.required && !values[v.name]?.trim()) {
          missing.push(v.name);
        }
      }
      setInvalidFields(new Set(missing));
      return missing;
    },
    clearValidation: () => setInvalidFields(new Set()),
  }), [variables, values]);

  const handleSaveBookmark = (name: string, val: string) => {
    if (!val.trim()) return;
    saveBookmark(name, val);
    setBookmarks(loadBookmarks());
    window.dispatchEvent(new CustomEvent('bookmarks-changed'));
  };

  const handleRemoveBookmark = (name: string) => {
    removeBookmark(name);
    setBookmarks(loadBookmarks());
    window.dispatchEvent(new CustomEvent('bookmarks-changed'));
  };

  const handleFillBookmark = (name: string, val: string) => {
    onChange(name, val);
    addBookmarkHistoryEntry(name, val);
  };

  const bookmarkedVars = variables.filter((v) => bookmarks[v.name]);

  if (variables.length === 0) {
    return (
      <section className="variable-form-section rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">{t.sectionTitle}</h3>
        <p className="text-base text-slate-500 sm:text-sm dark:text-slate-400">{t.noVariables}</p>
      </section>
    );
  }

  return (
    <section className="variable-form-section rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t.sectionTitle}</h3>
        {stockStatusText ? <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{stockStatusText}</p> : null}
      </div>

      {bookmarkedVars.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-900/30">
          <p className="mb-2 text-xs font-medium text-amber-700 dark:text-amber-400">{t.bookmarkFill}</p>
          <div className="flex flex-wrap gap-2">
            {bookmarkedVars.map((v) => (
              <button
                key={v.name}
                type="button"
                onClick={() => handleFillBookmark(v.name, bookmarks[v.name])}
                className="flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-2 py-2 text-xs text-slate-700 transition hover:border-amber-500 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1 dark:border-amber-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-amber-900/50 min-h-[44px]"
              >
                <BookmarkIcon filled />
                <span className="font-medium">{v.name}:</span>
                <span className="max-w-[80px] truncate sm:max-w-[120px]">{bookmarks[v.name]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {variables.map((variable, index) => {
          const value = values[variable.name] ?? '';
          const label = variable.required ? `${variable.name} *` : variable.name;
          const isBookmarked = !!bookmarks[variable.name];
          const isInvalid = invalidFields.has(variable.name);

          return (
            <div key={variable.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor={`var-${variable.id}`} className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {label}
                </label>
                {value.trim() && (
                  <button
                    type="button"
                    onClick={() => isBookmarked ? handleRemoveBookmark(variable.name) : handleSaveBookmark(variable.name, value)}
                    className="flex items-center gap-1 rounded-md p-2 min-h-[44px] min-w-[44px] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 dark:hover:bg-slate-700"
                    title={isBookmarked ? t.removeBookmark : t.addBookmark}
                  >
                    <BookmarkIcon filled={isBookmarked} />
                  </button>
                )}
              </div>

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
                  className={`${FIELD_BASE} px-4 py-3 sm:px-3 sm:py-2 ${
                    isInvalid ? FIELD_INVALID_CLASSES : FIELD_NORMAL_CLASSES
                  }`}
                  onKeyDown={(event) => handleEnterToNext(event, index, true)}
                  onChange={(event) => onChange(variable.name, event.target.value)}
                />
              ) : null}

              {variable.type === 'select' ? (
                <select
                  id={`var-${variable.id}`}
                  data-field-index={index}
                  value={value}
                  className={`${FIELD_BASE} px-3 py-3 sm:py-2 min-h-[48px] ${
                    isInvalid
                      ? `${FIELD_INVALID_CLASSES} dark:bg-slate-800 dark:text-slate-200`
                      : FIELD_NORMAL_CLASSES
                  }`}
                  onChange={(event) => onChange(variable.name, event.target.value)}
                >
                  <option value="">{t.selectPlaceholder}</option>
                  {(variable.options ?? []).map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : null}

              {['text', 'date', 'time', 'datetime', 'number'].includes(variable.type ?? 'text') ? (
                <input
                  id={`var-${variable.id}`}
                  data-field-index={index}
                  type={
                    variable.type === 'date' ? 'date'
                      : variable.type === 'time' ? 'time'
                      : variable.type === 'number' ? 'number'
                      : 'text'
                  }
                  value={value}
                  enterKeyHint="next"
                  placeholder={variable.placeholder ?? ''}
                  className={`${FIELD_BASE} px-4 py-3 sm:px-3 sm:py-2 ${
                    isInvalid
                      ? `${FIELD_INVALID_CLASSES} dark:bg-slate-800 dark:text-slate-200`
                      : FIELD_NORMAL_CLASSES
                  }`}
                  onKeyDown={(event) => handleEnterToNext(event, index)}
                  onChange={(event) => onChange(variable.name, event.target.value)}
                />
              ) : null}

              {variable.hint ? <p className="text-xs text-slate-500 dark:text-slate-400">{variable.hint}</p> : null}
            </div>
          );
        })}
      </div>

      {invalidFields.size > 0 && (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
          {t.validationFailed}{Array.from(invalidFields).join('、')}
        </p>
      )}
    </section>
  );
});
