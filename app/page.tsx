'use client';

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';

import { PlatformActions } from '@/components/platform-actions';
import { VariableForm } from '@/components/variable-form';
import { AUTO_FILL_NAMES } from '@/lib/auto-fill';
import { createClientFallbackStocks } from '@/lib/stocks';
import { loadLocalTemplates, saveLocalTemplates } from '@/lib/storage';
import {
  buildMarkdownExport,
  parseTemplate,
  renderPrompt,
  renderPromptSegments
} from '@/lib/template-parser';
import { StockItem, StoredTemplate } from '@/lib/types';

interface TemplateResponse {
  items: StoredTemplate[];
}

interface StocksResponse {
  count: number;
  updatedAt: string;
  usedFallback: boolean;
  partialFallback: boolean;
  marketCounts: {
    CN: number;
    HK: number;
    US: number;
  };
  items: StockItem[];
}

function countFallbackByMarket(items: StockItem[]): { CN: number; HK: number; US: number } {
  const counts = { CN: 0, HK: 0, US: 0 };
  for (const item of items) {
    counts[item.market] += 1;
  }
  return counts;
}

const STOCK_TEMPLATE_KEYWORDS = ['股票', 'a股', '港股', '美股', '个股', '证券', '财报'];
const PINNED_BUILTIN_TITLES = ['个股分析', '由新闻分析个股板块影响', '枯燥报告转生动网页'];
const DEFAULT_TEMPLATE_TITLE = '个股分析';

// Smart suggestion: intent → { templateTitle, autoFill?: { varName, value }, description }
interface SmartSuggestion {
  templateTitle: string;
  autoFill?: { varName: string; value: string };
  description: string;
}

const SMART_SUGGESTIONS: Array<{ patterns: string[]; suggestion: SmartSuggestion }> = [
  {
    patterns: ['分析', '个股', '股票', '公司'],
    suggestion: {
      templateTitle: '个股分析',
      description: '分析单家公司基本面'
    }
  },
  {
    patterns: ['新闻', '公告', '消息'],
    suggestion: {
      templateTitle: '由新闻分析个股板块影响',
      description: '分析新闻对板块的影响'
    }
  },
  {
    patterns: ['枯燥', '无聊', '报告', '生动', '网页'],
    suggestion: {
      templateTitle: '枯燥报告转生动网页',
      description: '把枯燥报告转成生动网页'
    }
  }
];

function matchSmartSuggestions(query: string): SmartSuggestion | null {
  const q = query.toLowerCase();
  for (const { patterns, suggestion } of SMART_SUGGESTIONS) {
    if (patterns.some((p) => q.includes(p))) {
      return suggestion;
    }
  }
  return null;
}

function extractStockFromQuery(query: string, stocks: StockItem[]): string | null {
  for (const stock of stocks) {
    if (query.includes(stock.name) || query.includes(stock.code)) {
      return stock.name;
    }
    for (const alias of stock.aliases) {
      if (query.includes(alias)) {
        return stock.name;
      }
    }
  }
  return null;
}

function scoreTemplate(template: StoredTemplate, query: string, stocks: StockItem[]): number {
  const q = query.toLowerCase().trim();
  if (!q) return 1;

  const title = template.title.toLowerCase();
  const content = template.rawMarkdown.toLowerCase();

  // Exact title match
  if (title === q) return 100;
  if (title.includes(q)) return 80;

  // Title keywords
  const qWords = q.split(/\s+/);
  const titleMatches = qWords.filter((w) => title.includes(w)).length;
  if (titleMatches > 0) return 60 + titleMatches * 10;

  // Content match
  const contentMatches = qWords.filter((w) => content.includes(w)).length;
  if (contentMatches > 0) return 30 + contentMatches * 5;

  // Stock name in query matches template content keywords
  const stockName = extractStockFromQuery(query, stocks);
  if (stockName) {
    const stockLower = stockName.toLowerCase();
    if (title.includes(stockLower) || content.includes(stockLower)) {
      return 70;
    }
  }

  // Smart suggestion match
  const suggestion = matchSmartSuggestions(query);
  if (suggestion && suggestion.templateTitle === template.title) {
    return 90;
  }

  return 0;
}

function getTemplateOrderRank(item: StoredTemplate): number {
  if (item.source !== 'builtin') {
    return Number.MAX_SAFE_INTEGER;
  }

  const index = PINNED_BUILTIN_TITLES.indexOf(item.title);
  if (index >= 0) {
    return index;
  }

  return 100;
}

function pickPreferredTemplate(items: StoredTemplate[]): StoredTemplate | null {
  if (items.length === 0) {
    return null;
  }

  return items.find((item) => item.title === DEFAULT_TEMPLATE_TITLE) ?? items[0];
}

function mergeTemplates(builtin: StoredTemplate[], local: StoredTemplate[]): StoredTemplate[] {
  const map = new Map<string, StoredTemplate>();

  for (const item of builtin) {
    map.set(item.id, item);
  }

  for (const item of local) {
    map.set(item.id, item);
  }

  return [...map.values()].sort((a, b) => {
    const rankDiff = getTemplateOrderRank(a) - getTemplateOrderRank(b);
    if (rankDiff !== 0) {
      return rankDiff;
    }

    if (a.source !== b.source) {
      return a.source === 'builtin' ? -1 : 1;
    }

    if (a.source === 'builtin') {
      return a.title.localeCompare(b.title, 'zh-CN');
    }

    return b.updatedAt - a.updatedAt;
  });
}

function getLocalTemplates(templates: StoredTemplate[]): StoredTemplate[] {
  return templates.filter((item) => item.source === 'local');
}

export default function HomePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const clientFallback = useMemo(() => createClientFallbackStocks(), []);

  const [templates, setTemplates] = useState<StoredTemplate[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [draftMarkdown, setDraftMarkdown] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [stocks, setStocks] = useState<StockItem[]>(clientFallback);
  const [notice, setNotice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockMeta, setStockMeta] = useState<{
    count: number;
    updatedAt: string;
    usedFallback: boolean;
    partialFallback: boolean;
    marketCounts: { CN: number; HK: number; US: number };
  }>({
    count: clientFallback.length,
    updatedAt: new Date().toISOString(),
    usedFallback: true,
    partialFallback: false,
    marketCounts: countFallbackByMarket(clientFallback)
  });

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === selectedId) ?? null,
    [templates, selectedId]
  );

  const parsed = useMemo(() => {
    if (!selectedTemplate) {
      return null;
    }

    return parseTemplate({
      ...selectedTemplate,
      rawMarkdown: draftMarkdown
    });
  }, [selectedTemplate, draftMarkdown]);

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) {
      return templates;
    }
    return templates
      .map((t) => ({ template: t, score: scoreTemplate(t, searchQuery, stocks) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ template }) => template);
  }, [templates, searchQuery, stocks]);

  const activeSuggestion = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const suggestion = matchSmartSuggestions(searchQuery);
    if (!suggestion) return null;
    const matched = templates.find((t) => t.title === suggestion.templateTitle);
    if (!matched) return null;
    const stockName = extractStockFromQuery(searchQuery, stocks);
    return { suggestion, templateId: matched.id, stockName };
  }, [searchQuery, templates, stocks]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      } else {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            void registration.unregister();
          }
        });
        if ('caches' in window) {
          caches.keys().then((keys) => {
            for (const key of keys) {
              if (key.startsWith('promptpage-')) {
                void caches.delete(key);
              }
            }
          });
        }
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      const localTemplates = loadLocalTemplates();

      let builtinTemplates: StoredTemplate[] = [];
      try {
        const response = await fetch('/api/builtin-templates');
        const data = (await response.json()) as TemplateResponse;
        builtinTemplates = data.items ?? [];
      } catch {
        builtinTemplates = [];
      }

      if (cancelled) {
        return;
      }

      const merged = mergeTemplates(builtinTemplates, localTemplates);
      setTemplates(merged);

      const preferred = pickPreferredTemplate(merged);
      if (preferred) {
        setSelectedId(preferred.id);
        setDraftMarkdown(preferred.rawMarkdown);
      }
    }

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadStocks() {
      try {
        const response = await fetch('/api/stocks');
        const data = (await response.json()) as StocksResponse;

        if (!cancelled && Array.isArray(data.items) && data.items.length > 0) {
          setStocks(data.items);
          setStockMeta({
            count: data.count,
            updatedAt: data.updatedAt,
            usedFallback: data.usedFallback,
            partialFallback: data.partialFallback,
            marketCounts: data.marketCounts
          });
        }
      } catch {
        if (!cancelled) {
          setStocks(clientFallback);
          setStockMeta({
            count: clientFallback.length,
            updatedAt: new Date().toISOString(),
            usedFallback: true,
            partialFallback: false,
            marketCounts: countFallbackByMarket(clientFallback)
          });
        }
      }
    }

    void loadStocks();

    return () => {
      cancelled = true;
    };
  }, [clientFallback]);

  useEffect(() => {
    if (!parsed) {
      setValues({});
      return;
    }

    setValues((previous) => {
      const next: Record<string, string> = {};
      for (const variable of parsed.variables) {
        const prevValue = previous[variable.name];
        if (typeof prevValue === 'string' && prevValue.length > 0) {
          next[variable.name] = prevValue;
          continue;
        }

        if (variable.autoFill) {
          next[variable.name] = variable.value ?? '';
          continue;
        }

        next[variable.name] = prevValue ?? variable.value ?? '';
      }
      return next;
    });
  }, [parsed]);

  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }

    setDraftMarkdown(selectedTemplate.rawMarkdown);
  }, [selectedTemplate]);

  const rendered = useMemo(() => {
    if (!parsed) {
      return '';
    }

    return renderPrompt(parsed.content, values);
  }, [parsed, values]);

  const renderedSegments = useMemo(() => {
    if (!parsed) {
      return [];
    }

    return renderPromptSegments(parsed.content, values);
  }, [parsed, values]);

  const shouldShowStockStatus = useMemo(() => {
    if (!parsed) {
      return false;
    }

    const title = parsed.title.toLowerCase();
    return STOCK_TEMPLATE_KEYWORDS.some((keyword) => title.includes(keyword.toLowerCase()));
  }, [parsed]);

  const stockStatusText = useMemo(() => {
    if (!shouldShowStockStatus) {
      return '';
    }

    const date = new Date(stockMeta.updatedAt);
    const shortTime = date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    const source = stockMeta.usedFallback
      ? '兜底数据'
      : stockMeta.partialFallback
        ? '在线+兜底'
        : '在线数据';

    return `股票库 ${stockMeta.count} 条 · A ${stockMeta.marketCounts.CN} / H ${stockMeta.marketCounts.HK} / US ${stockMeta.marketCounts.US} · ${source} · ${shortTime}`;
  }, [shouldShowStockStatus, stockMeta]);

  function showNotice(text: string) {
    setNotice(text);
    window.setTimeout(() => setNotice(''), 1800);
  }

  function handleTemplateSelect(id: string) {
    setSelectedId(id);
  }

  function handleSuggestionClick(suggestion: SmartSuggestion, stockName: string | null) {
    const matched = templates.find((t) => t.title === suggestion.templateTitle);
    if (!matched) return;
    setSelectedId(matched.id);

    if (suggestion.autoFill || stockName) {
      const parsedTemplate = parseTemplate({ ...matched, rawMarkdown: matched.rawMarkdown });
      const newValues: Record<string, string> = { ...values };
      if (suggestion.autoFill) {
        newValues[suggestion.autoFill.varName] = suggestion.autoFill.value;
      }
      if (stockName) {
        const stockVar = parsedTemplate.variables.find((v) => v.type === 'stock');
        if (stockVar) {
          newValues[stockVar.name] = stockName;
        }
      }
      setValues(newValues);
    }

    setSearchQuery('');
  }

  function handleUploadClick() {
    inputRef.current?.click();
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    const localTemplate: StoredTemplate = {
      id: `local:${crypto.randomUUID()}`,
      title: file.name.replace(/\.md$/i, ''),
      rawMarkdown: text,
      source: 'local',
      updatedAt: Date.now()
    };

    setTemplates((previous) => {
      const next = mergeTemplates([], [localTemplate, ...previous]);
      saveLocalTemplates(getLocalTemplates(next));
      return next;
    });

    setSelectedId(localTemplate.id);
    setDraftMarkdown(text);
    event.target.value = '';
    showNotice('模板已导入');
  }

  function handleSaveTemplate() {
    if (!selectedTemplate) {
      return;
    }

    if (selectedTemplate.source === 'builtin') {
      const copied: StoredTemplate = {
        id: `local:${crypto.randomUUID()}`,
        title: `${selectedTemplate.title}-副本`,
        rawMarkdown: draftMarkdown,
        source: 'local',
        updatedAt: Date.now()
      };

      setTemplates((previous) => {
        const next = mergeTemplates([], [copied, ...previous]);
        saveLocalTemplates(getLocalTemplates(next));
        return next;
      });
      setSelectedId(copied.id);
      showNotice('已另存为本地模板副本');
      return;
    }

    setTemplates((previous) => {
      const next = previous.map((item) => {
        if (item.id !== selectedTemplate.id) {
          return item;
        }

        return {
          ...item,
          rawMarkdown: draftMarkdown,
          updatedAt: Date.now()
        };
      });
      saveLocalTemplates(getLocalTemplates(next));
      return next;
    });
    showNotice('模板已保存');
  }

  function handleExportTemplate() {
    if (!parsed) {
      return;
    }

    const output = buildMarkdownExport(parsed);
    const blob = new Blob([output], { type: 'text/markdown;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `${parsed.title || 'prompt-template'}.md`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 200);
    showNotice('模板已导出为 Markdown');
  }

  function handleDeleteTemplate() {
    if (!selectedTemplate) {
      return;
    }

    if (selectedTemplate.source !== 'local') {
      showNotice('内置模板不支持删除');
      return;
    }

    const ok = window.confirm(`确认删除本地模板「${selectedTemplate.title}」？`);
    if (!ok) {
      return;
    }

    setTemplates((previous) => {
      const next = previous.filter((item) => item.id !== selectedTemplate.id);
      saveLocalTemplates(getLocalTemplates(next));

      const nextSelected = pickPreferredTemplate(next);
      setSelectedId(nextSelected?.id ?? '');
      setDraftMarkdown(nextSelected?.rawMarkdown ?? '');

      return next;
    });
    showNotice('本地模板已删除');
  }

  return (
    <main className="px-3 py-4 sm:px-5 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3">
        <header className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">PromptDock</h1>
              <p className="mt-1 text-xs text-slate-500">配置一套提示词，在所有 AI 平台快速调用</p>
            </div>
            <p className="min-h-4 text-xs text-teal-700">{notice || ' '}</p>
          </div>
        </header>

        <div className="grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-3 lg:sticky lg:top-3 lg:h-fit">
            <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-soft">
              <div className="mb-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-800">模板列表</h2>
                  <button
                    type="button"
                    onClick={handleUploadClick}
                    className="rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs font-medium text-teal-700 transition hover:bg-teal-100"
                  >
                    上传 .md
                  </button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".md,text/markdown"
                    className="hidden"
                    onChange={(event) => {
                      void handleFileUpload(event);
                    }}
                  />
                </div>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索模板（支持语义描述）"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
                />

                {activeSuggestion && (
                  <button
                    type="button"
                    onClick={() => handleSuggestionClick(activeSuggestion.suggestion, activeSuggestion.stockName)}
                    className="flex w-full items-center gap-2 rounded-xl border border-teal-300 bg-teal-50 px-3 py-2 text-left transition hover:bg-teal-100"
                  >
                    <span className="shrink-0 text-xs text-teal-600">💡</span>
                    <span className="truncate text-sm text-teal-800">
                      {activeSuggestion.suggestion.description}
                      {activeSuggestion.stockName ? `（将填入「${activeSuggestion.stockName}」）` : ''}
                    </span>
                  </button>
                )}
              </div>

              <p className="mb-3 text-xs leading-5 text-slate-500">
                上传的 .md 模板仅保存在当前设备浏览器本地缓存，不会自动同步到其他设备。
              </p>
              <p className="mb-3 text-xs leading-5 text-slate-500">
                模板正文可直接使用，不需要固定开场语法；系统仅识别 [] 作为变量占位符。
              </p>

              <div className="max-h-[70vh] space-y-2 overflow-auto pr-1">
                {(searchQuery.trim() ? filteredTemplates : templates).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTemplateSelect(item.id)}
                    className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                      selectedId === item.id
                        ? 'border-teal-400 bg-teal-50 text-teal-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {item.source === 'builtin' ? '内置模板' : '本地模板'}
                    </p>
                  </button>
                ))}

                {templates.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-500">
                    先上传一个 .md 模板
                  </p>
                ) : null}
              </div>
            </section>
          </aside>

          <section className="space-y-3">
            <VariableForm
              variables={parsed?.variables ?? []}
              values={values}
              stocks={stocks}
              stockStatusText={stockStatusText || undefined}
              onChange={(name, value) => {
                setValues((previous) => ({
                  ...previous,
                  [name]: value
                }));
              }}
            />

            <PlatformActions content={rendered} />

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-800">模板与预览</h3>
                <p className="text-xs text-slate-500">高亮部分为已填充变量</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                  {renderedSegments.map((segment, index) =>
                    segment.isFilled ? (
                      <span
                        key={`seg-${index}`}
                        className="rounded bg-teal-100 px-1 font-mono text-teal-800"
                      >
                        {segment.text}
                      </span>
                    ) : (
                      <span key={`seg-${index}`}>{segment.text}</span>
                    )
                  )}
                </pre>
              </div>

              <details className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
                <summary className="cursor-pointer select-none font-medium text-slate-700">
                  高级设置：编辑模板 / 保存 / 导出 / 删除
                </summary>

                <div className="mt-3 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleSaveTemplate}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 transition hover:bg-slate-50"
                    >
                      保存模板
                    </button>
                    <button
                      type="button"
                      onClick={handleExportTemplate}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 transition hover:bg-slate-50"
                    >
                      导出 Markdown
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteTemplate}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={selectedTemplate?.source !== 'local'}
                      title={selectedTemplate?.source === 'local' ? '删除当前本地模板' : '内置模板不可删除'}
                    >
                      删除本地模板
                    </button>
                  </div>

                  <textarea
                    value={draftMarkdown}
                    rows={14}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base leading-6 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 sm:text-sm"
                    placeholder="在这里临时调整模板内容"
                    onChange={(event) => setDraftMarkdown(event.target.value)}
                  />
                </div>
              </details>

              <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                <summary className="cursor-pointer select-none font-medium">自动变量（可选）</summary>
                <p className="mt-2 leading-5">
                  仅以下变量名会自动填充：
                  {AUTO_FILL_NAMES.map((name) => ` [${name}]`).join('')}
                  。其他所有 [] 都按手动输入处理。
                </p>
              </details>
            </section>
          </section>
        </div>

        <footer className="px-1 pb-1 pt-2 text-center text-xs text-slate-500">
          <p>© 2026 cyberteng. All rights reserved.</p>
          <p>
            公共模板投稿：Pull Request（
            <a
              href="https://github.com/nbzz/PromptDock"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-teal-700"
            >
              GitHub: PromptDock
            </a>
            ），或联系
            <a
              href="mailto:tz@ittz.top"
              className="ml-1 font-medium text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-teal-700"
            >
              tz@ittz.top
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
