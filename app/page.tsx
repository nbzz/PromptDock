'use client';

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';

import Fuse from 'fuse.js';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

import { BookmarkPanel } from '@/components/bookmark-panel';
import { HistoryPanel } from '@/components/history-panel';
import { PlatformActions } from '@/components/platform-actions';
import { QRModal } from '@/components/qr-modal';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { VariableForm, VariableFormRef } from '@/components/variable-form';
import { AUTO_FILL_NAMES } from '@/lib/auto-fill';
import { PLATFORMS } from '@/lib/platforms';
import { clearHistory, loadHistory, pushHistory } from '@/lib/history';
import { createClientFallbackStocks } from '@/lib/stocks';
import { loadLocalTemplates, saveLocalTemplates, loadTags, saveTags, exportAllData, downloadBackup, STORAGE_KEYS, safeGet, safeSet } from '@/lib/storage';
import {
  buildMarkdownExport,
  parseTemplate,
  renderPrompt,
  renderPromptSegments
} from '@/lib/template-parser';
import { PromptHistoryEntry, StockItem, StoredTemplate } from '@/lib/types';

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

const I18N = {
  zh: {
    appTitle: 'PromptDock',
    appDesc: '配置一套提示词，在所有 AI 平台快速调用',
    templateList: '模板列表',
    upload: '上传 .md',
    searchPlaceholder: '搜索模板...',
    noTemplates: '先上传一个 .md 模板',
    noResults: '未找到匹配的模板',
    variableSection: '变量填写',
    noVariables: '这个模板没有变量，直接可用。',
    builtIn: '内置模板',
    local: '本地模板',
    required: '*',
    platformActions: '快捷动作（复制并跳转）',
    copyOnly: '仅复制',
    templatePreview: '模板与预览',
    highlightTip: '高亮部分为已填充变量',
    advancedSettings: '高级设置：编辑模板 / 保存 / 导出 / 删除',
    save: '保存模板',
    exportMd: '导出 Markdown',
    shareLink: '分享链接',
    qrCode: '二维码',
    delete: '删除本地模板',
    shareNotice: '分享链接已复制',
    savedNotice: '模板已保存',
    deletedNotice: '本地模板已删除',
    advancedTip: '自动变量（可选）',
    footer: '© 2026 cyberteng. All rights reserved.',
    pr: '公共模板投稿：Pull Request',
    contact: '，或联系',
    recentHistory: '最近使用',
    clearHistory: '清空',
    noHistory: '还没有历史记录。',
    copyOnlyAction: '仅复制',
    copyAndOpenAction: '复制并打开',
    autoFillTip: '仅以下变量名会自动填充：',
    autoFillSuffix: '。其他所有 [] 都按手动输入处理。',
    templateNotice1: '上传的 .md 模板仅保存在当前设备浏览器本地缓存，不会自动同步到其他设备。',
    templateNotice2: '模板正文可直接使用，不需要固定开场语法；系统仅识别 [] 作为变量占位符。',
    importedNotice: '模板已导入',
    savedAsCopyNotice: '已另存为本地模板副本',
    exportedNotice: '模板已导出为 Markdown',
    builtinNoDeleteNotice: '内置模板不支持删除',
    confirmDelete: '确认删除本地模板「{title}」？',
    batchDeleteConfirm: '确认删除选中的 {count} 个本地模板？此操作不可恢复。',
    batchDelete: '批量删除',
    selectAll: '全选',
    deselectAll: '取消全选',
    sharedLoadedNotice: '已加载分享的模板',
    shareInvalidNotice: '分享链接无效',
    tagManage: '标签管理',
    addTag: '添加',
    tagInputPlaceholder: '输入标签后按回车',
    scanQRTitle: '扫码使用模板',
    scanQRTip: '截图保存',
    close: '关闭',
    bookmarkFill: '书签快速填充',
    addBookmark: '添加书签',
    removeBookmark: '移除书签',
    selectPlaceholder: '请选择',
    validationFailed: '请填写必填字段：',
    exportAllData: '导出全部数据',
    importFromUrl: '从链接导入',
    importUrlPlaceholder: '粘贴分享链接...',
    importUrlCancel: '取消',
    importUrlConfirm: '导入',
    importSuccessNotice: '已从分享链接导入模板',
    importFailNotice: '链接无效或已过期',
  },
  en: {
    appTitle: 'PromptDock',
    appDesc: 'Configure prompts and invoke them across all AI platforms instantly',
    templateList: 'Templates',
    upload: 'Upload .md',
    searchPlaceholder: 'Search templates...',
    noTemplates: 'Upload a .md template first',
    noResults: 'No matching templates found',
    variableSection: 'Variables',
    noVariables: 'This template has no variables and is ready to use.',
    builtIn: 'Built-in',
    local: 'Local',
    required: '*',
    platformActions: 'Quick Actions (Copy & Open)',
    copyOnly: 'Copy Only',
    templatePreview: 'Template & Preview',
    highlightTip: 'Highlighted parts are filled variables',
    advancedSettings: 'Advanced: Edit / Save / Export / Delete',
    save: 'Save',
    exportMd: 'Export Markdown',
    shareLink: 'Share Link',
    qrCode: 'QR Code',
    delete: 'Delete Local',
    shareNotice: 'Share link copied',
    savedNotice: 'Template saved',
    deletedNotice: 'Local template deleted',
    advancedTip: 'Auto Variables (Optional)',
    footer: '© 2026 cyberteng. All rights reserved.',
    pr: 'Submit templates via Pull Request',
    contact: ', or contact',
    recentHistory: 'Recent',
    clearHistory: 'Clear',
    noHistory: 'No history yet.',
    copyOnlyAction: 'Copy',
    copyAndOpenAction: 'Copy & Open',
    autoFillTip: 'Only the following variable names are auto-filled:',
    autoFillSuffix: ' All other [] are treated as manual input.',
    templateNotice1: '.md templates are stored in browser local storage only.',
    templateNotice2: 'Use [] as variable placeholders. No prefix syntax needed.',
    importedNotice: 'Template imported',
    savedAsCopyNotice: 'Saved as local template copy',
    exportedNotice: 'Template exported as Markdown',
    builtinNoDeleteNotice: 'Built-in templates cannot be deleted',
    confirmDelete: 'Delete local template "{title}"?',
    batchDeleteConfirm: 'Delete {count} selected local templates? This cannot be undone.',
    batchDelete: 'Batch Delete',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    sharedLoadedNotice: 'Shared template loaded',
    shareInvalidNotice: 'Invalid share link',
    tagManage: 'Tags',
    addTag: 'Add',
    tagInputPlaceholder: 'Type tag and press Enter',
    scanQRTitle: 'Scan to use template',
    scanQRTip: 'Screenshot to save',
    close: 'Close',
    bookmarkFill: 'Bookmark Quick Fill',
    addBookmark: 'Add Bookmark',
    removeBookmark: 'Remove Bookmark',
    selectPlaceholder: 'Select...',
    validationFailed: 'Please fill required fields: ',
    exportAllData: 'Export All Data',
    importFromUrl: 'Import from URL',
    importUrlPlaceholder: 'Paste share URL...',
    importUrlCancel: 'Cancel',
    importUrlConfirm: 'Import',
    importSuccessNotice: 'Template imported from share URL',
    importFailNotice: 'Invalid or expired share link',
  },
} as const;

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

  const [lang, setLang] = useState<'zh' | 'en'>(() => {
    if (typeof window !== 'undefined') {
      return safeGet<'zh' | 'en'>(STORAGE_KEYS.LANG, 'zh');
    }
    return 'zh';
  });
  const t = (key: keyof typeof I18N.zh) => I18N[lang][key];
  const [tagInput, setTagInput] = useState('');
  const [templateTags, setTemplateTags] = useState<Record<string, string[]>>({});
  const [templates, setTemplates] = useState<StoredTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  type FilterTab = 'all' | 'financial' | 'news' | 'writing' | 'other';
const [filterTab, setFilterTab] = useState<FilterTab>('all');

const CATEGORY_LABELS: Record<FilterTab, string> = {
  all: '全部',
  financial: '金融分析',
  news: '新闻资讯',
  writing: '写作创作',
  other: '其他',
};

const FINANCIAL_KEYWORDS = ['审计', '财务', '竞争', 'comps', 'dcf', 'lbo', '杠杆', '宏观', '建模', '三表', '企业竞争', '个股', '分析报告', '现金流折现', '数据清洗'];
const NEWS_KEYWORDS = ['新闻', '财经新闻'];
const WRITING_KEYWORDS = ['报告转', '网页', '体育营销', '学术论文', '论文结构化', '西甲', '提示词生成', '提示词压缩', '品牌体育'];

function getTemplateCategory(item: StoredTemplate): FilterTab {
  const title = item.title.toLowerCase();
  const desc = (item.rawMarkdown.match(/description:\s*(.+)/i)?.[1] ?? '').toLowerCase();

  if (FINANCIAL_KEYWORDS.some((kw) => title.includes(kw) || desc.includes(kw))) return 'financial';
  if (NEWS_KEYWORDS.some((kw) => title.includes(kw) || desc.includes(kw))) return 'news';
  if (WRITING_KEYWORDS.some((kw) => title.includes(kw) || desc.includes(kw))) return 'writing';
  return 'other';
}
  const [selectedId, setSelectedId] = useState('');
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(-1);
  const [batchSelectedIds, setBatchSelectedIds] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return safeGet<string[]>(STORAGE_KEYS.FAVORITES, []);
      } catch {
        return [];
      }
    }
    return [];
  });
  const batchStartRef = useRef<number>(-1);
  const templateListRef = useRef<HTMLDivElement>(null);
  const variableFormRef = useRef<VariableFormRef>(null);
  const [draftMarkdown, setDraftMarkdown] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [stocks, setStocks] = useState<StockItem[]>(clientFallback);
  const [notice, setNotice] = useState('');
  const [noticeKey, setNoticeKey] = useState(0);
  const [qrModalText, setQrModalText] = useState('');
  const [history, setHistory] = useState<PromptHistoryEntry[]>([]);
  const [shareCount, setShareCount] = useState<number>(0);
  const [swUpdateAvailable, setSwUpdateAvailable] = useState(false);
  const [bookmarkPanelOpen, setBookmarkPanelOpen] = useState(false);
  const [saveConfirmDialog, setSaveConfirmDialog] = useState<{template: StoredTemplate; draftMarkdown: string} | null>(null);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ template: StoredTemplate } | null>(null);
  const [batchDeleteConfirmDialog, setBatchDeleteConfirmDialog] = useState<{ count: number } | null>(null);
  const [showImportUrl, setShowImportUrl] = useState(false);
  const [importUrlInput, setImportUrlInput] = useState('');

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
    let result = templates;
    // Sort favorites to top (preserving original relative order within each group)
    result = [...result].sort((a, b) => {
      const aFav = favorites.includes(a.id);
      const bFav = favorites.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return 0;
    });
    if (filterTab !== 'all') {
      result = result.filter((item) => {
        const title = item.title.toLowerCase();
        const desc = (item.rawMarkdown.match(/description:\s*(.+)/i)?.[1] ?? '').toLowerCase();
        if (filterTab === 'financial' && FINANCIAL_KEYWORDS.some((kw) => title.includes(kw) || desc.includes(kw))) return true;
        if (filterTab === 'news' && NEWS_KEYWORDS.some((kw) => title.includes(kw) || desc.includes(kw))) return true;
        if (filterTab === 'writing' && WRITING_KEYWORDS.some((kw) => title.includes(kw) || desc.includes(kw))) return true;
        return false;
      });
    }
    if (searchQuery.trim()) {
      // Create search items that include template tags
      const searchItems = result.map((t) => ({
        ...t,
        tags: templateTags[t.id] ?? [],
      }));
      const fuse = new Fuse(searchItems, {
        keys: [
          { name: 'title', weight: 0.6 },
          { name: 'tags', weight: 0.3 },
          { name: 'rawMarkdown', weight: 0.1 },
        ],
        threshold: 0.4,
        includeScore: true,
        minMatchCharLength: 1,
      });
      const fuzzyResults = fuse.search(searchQuery.trim());
      result = fuzzyResults.map((r) => r.item);
    }
    return result;
  }, [templates, searchQuery, filterTab, favorites, templateTags, FINANCIAL_KEYWORDS, NEWS_KEYWORDS, WRITING_KEYWORDS]);

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

  // Listen for SW update notifications
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    function handleMessage(event: MessageEvent) {
      if (event.data?.type === 'SW_UPDATE_AVAILABLE') {
        setSwUpdateAvailable(true);
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let cancelled = false;

    const currentT = t; // capture at effect creation time
    async function loadInitialData() {
      const localTemplates = loadLocalTemplates();

      // Check for shared template in URL
      const params = new URLSearchParams(window.location.search);
      const shareData = params.get('t');

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

      // If shared template in URL, load it
      if (shareData) {
        try {
          const markdown = decompressFromEncodedURIComponent(shareData);
          if (!markdown) {
            showNotice(currentT('shareInvalidNotice'));
            return;
          }
          const sharedTemplate: StoredTemplate = {
            id: `shared:${Date.now()}`,
            title: '分享的模板',
            rawMarkdown: markdown,
            source: 'local',
            updatedAt: Date.now()
          };
          setTemplates((prev) => mergeTemplates([], [sharedTemplate, ...prev]));
          setSelectedId(sharedTemplate.id);
          setDraftMarkdown(markdown);
          showNotice(currentT('sharedLoadedNotice'));
          // Clear URL param
          window.history.replaceState({}, '', window.location.pathname);
          return;
        } catch {
          showNotice(currentT('shareInvalidNotice'));
        }
      }

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
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    setShareCount(safeGet<number>(STORAGE_KEYS.SHARE_COUNT, 0));
  }, []);

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
    const index = filteredTemplates.findIndex((t) => t.id === selectedId);
    setSelectedTemplateIndex(index);
  }, [selectedId, filteredTemplates]);

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
    setNoticeKey((k) => k + 1);
    setNotice(text);
    window.setTimeout(() => setNotice(''), 1800);
  }

  function notifyBrowser(title: string, body: string) {
    if (typeof window === 'undefined') return;
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon.svg' });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          new Notification(title, { body, icon: '/icon.svg' });
        }
      });
    }
  }

  function handleTemplateSelect(id: string) {
    setSelectedId(id);
  }

  function handleTemplateListKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (filteredTemplates.length === 0) return;

    const isMac =
      typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const isCtrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

    // Escape - deselect all when batch bar is showing
    if (event.key === 'Escape') {
      event.preventDefault();
      setBatchSelectedIds(new Set());
      batchStartRef.current = -1;
      return;
    }

    // Delete/Backspace - delete selected templates
    if ((event.key === 'Delete' || event.key === 'Backspace') && batchSelectedIds.size > 0) {
      event.preventDefault();
      handleBatchDelete();
      return;
    }

    // Ctrl/Cmd+A - select all local templates in current filter
    if (event.key === 'a' && isCtrlOrCmd) {
      event.preventDefault();
      const localIds = filteredTemplates.filter((t) => t.source === 'local').map((t) => t.id);
      setBatchSelectedIds(new Set(localIds));
      return;
    }

    // Space - toggle selection of focused template
    if (event.key === ' ') {
      event.preventDefault();
      const item = filteredTemplates[selectedTemplateIndex];
      if (item?.source === 'local') {
        handleBatchSelect(item.id);
      }
      return;
    }

    const direction = event.key === 'ArrowDown' ? 1 : -1;
    const isArrowKey = event.key === 'ArrowDown' || event.key === 'ArrowUp';
    if (!isArrowKey) return;

    event.preventDefault();

    const prevIdx = selectedTemplateIndex;
    let nextIdx = prevIdx + direction;

    // Find next local template in direction
    while (nextIdx >= 0 && nextIdx < filteredTemplates.length) {
      if (filteredTemplates[nextIdx].source === 'local') break;
      nextIdx += direction;
    }

    if (nextIdx < 0 || nextIdx >= filteredTemplates.length) return;

    if (event.shiftKey) {
      // Range selection: Shift+Arrow
      if (batchStartRef.current === -1) {
        batchStartRef.current = prevIdx;
      }

      const start = Math.min(batchStartRef.current, nextIdx);
      const end = Math.max(batchStartRef.current, nextIdx);

      setBatchSelectedIds((prev) => {
        const next = new Set(prev);
        for (let i = start; i <= end; i++) {
          if (filteredTemplates[i].source === 'local') {
            next.add(filteredTemplates[i].id);
          }
        }
        return next;
      });
    } else {
      // Navigation without Shift - reset range anchor
      batchStartRef.current = -1;

      const prevItem = filteredTemplates[prevIdx];
      const nextItem = filteredTemplates[nextIdx];

      if (prevItem?.source === 'local' && nextItem?.source === 'local') {
        setBatchSelectedIds((prev) => {
          const next = new Set(prev);
          const start = Math.min(prevIdx, nextIdx);
          const end = Math.max(prevIdx, nextIdx);
          for (let i = start; i <= end; i++) {
            if (filteredTemplates[i].source === 'local') {
              next.add(filteredTemplates[i].id);
            }
          }
          return next;
        });
      }
    }

    setSelectedTemplateIndex(nextIdx);
    setSelectedId(filteredTemplates[nextIdx].id);
    const buttons = templateListRef.current?.querySelectorAll<HTMLButtonElement>('[data-template-btn]');
    buttons?.[nextIdx]?.focus();
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
    showNotice(t('importedNotice'));
  }

  function handleImportFromUrl() {
    const url = importUrlInput.trim();
    if (!url) return;

    try {
      const params = new URL(url);
      const shareData = params.searchParams.get('t');
      if (!shareData) {
        showNotice(t('importFailNotice'));
        setShowImportUrl(false);
        setImportUrlInput('');
        return;
      }

      const markdown = decompressFromEncodedURIComponent(shareData);
      if (!markdown) {
        showNotice(t('importFailNotice'));
        setShowImportUrl(false);
        setImportUrlInput('');
        return;
      }

      const importedTemplate: StoredTemplate = {
        id: `local:${crypto.randomUUID()}`,
        title: '分享的模板',
        rawMarkdown: markdown,
        source: 'local',
        updatedAt: Date.now()
      };

      setTemplates((previous) => {
        const next = mergeTemplates([], [importedTemplate, ...previous]);
        saveLocalTemplates(getLocalTemplates(next));
        return next;
      });

      setSelectedId(importedTemplate.id);
      setDraftMarkdown(markdown);
      showNotice(t('importSuccessNotice'));
    } catch {
      showNotice(t('importFailNotice'));
    }

    setShowImportUrl(false);
    setImportUrlInput('');
  }

  function handleSaveTemplate() {
    if (!selectedTemplate) {
      return;
    }

    // Show confirmation dialog first
    setSaveConfirmDialog({ template: selectedTemplate, draftMarkdown });
  }

  function confirmSave() {
    const dialog = saveConfirmDialog;
    if (!dialog) return;
    const { template } = dialog;

    if (template.source === 'builtin') {
      const copied: StoredTemplate = {
        id: `local:${crypto.randomUUID()}`,
        title: `${template.title}-副本`,
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
      showNotice(t('savedAsCopyNotice'));
      setSaveConfirmDialog(null);
      return;
    }

    setTemplates((previous) => {
      const next = previous.map((item) => {
        if (item.id !== template.id) {
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
    showNotice(t('savedNotice'));
    setSaveConfirmDialog(null);
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
    showNotice(t('exportedNotice'));
  }

  function handleExportAllData() {
    const data = exportAllData();
    downloadBackup(data);
  }

  async function handleShareViaUrl() {
    if (!parsed) {
      return;
    }
    const compressed = compressToEncodedURIComponent(draftMarkdown);
    const url = `${window.location.origin}${window.location.pathname}?t=${compressed}`;
    try {
      await navigator.clipboard.writeText(url);
      const next = shareCount + 1;
      setShareCount(next);
      safeSet(STORAGE_KEYS.SHARE_COUNT, next);
      showNotice(t('shareNotice'));
      alert(
        '✅ 分享链接已复制到剪贴板！\n\n' +
        '📋 粘贴给他人即可分享此模板\n' +
        '🔗 对方打开链接后，模板会自动导入到他的 PromptDock'
      );
    } catch {
      alert('❌ 复制失败，请手动复制地址栏链接');
    }
  }

  function handleShowQR() {
    if (!parsed) {
      return;
    }
    try {
      const compressed = compressToEncodedURIComponent(draftMarkdown);
      const url = `${window.location.origin}${window.location.pathname}?t=${compressed}`;
      if (url.length > 2000) {
        alert('⚠️ 模板内容过长，无法生成二维码\n\n请改用「分享链接」功能，将链接复制给对方');
        return;
      }
      setQrModalText(url);
    } catch {
      alert('❌ 生成二维码失败，请使用分享链接');
    }
  }

  function handleBatchDelete() {
    const count = batchSelectedIds.size;
    if (count === 0) return;
    setBatchDeleteConfirmDialog({ count });
  }

  function confirmBatchDelete() {
    setTemplates((previous) => {
      const next = previous.filter((item) => !batchSelectedIds.has(item.id));
      saveLocalTemplates(getLocalTemplates(next));
      return next;
    });
    setBatchSelectedIds(new Set());
    setBatchDeleteConfirmDialog(null);
    showNotice(t('deletedNotice'));
  }

  function handleBatchSelect(id: string) {
    setBatchSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleBatchSelectAll() {
    const localIds = filteredTemplates
      .filter((t) => t.source === 'local')
      .map((t) => t.id);
    setBatchSelectedIds(new Set(localIds));
  }

  function handleBatchDeselectAll() {
    setBatchSelectedIds(new Set());
  }

  function handleDeleteTemplate() {
    if (!selectedTemplate) {
      return;
    }

    if (selectedTemplate.source !== 'local') {
      showNotice(t('builtinNoDeleteNotice'));
      return;
    }

    setDeleteConfirmDialog({ template: selectedTemplate });
  }

  function confirmDelete() {
    const template = deleteConfirmDialog?.template;
    if (!template) return;

    setTemplates((previous) => {
      const next = previous.filter((item) => item.id !== template.id);
      saveLocalTemplates(getLocalTemplates(next));

      const nextSelected = pickPreferredTemplate(next);
      setSelectedId(nextSelected?.id ?? '');
      setDraftMarkdown(nextSelected?.rawMarkdown ?? '');

      return next;
    });
    setDeleteConfirmDialog(null);
    showNotice(t('deletedNotice'));
  }

  function toggleFavorite(id: string) {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id];
      safeSet(STORAGE_KEYS.FAVORITES, next);
      return next;
    });
  }

  async function copyAndOpenAction(platformKey: string, url: string) {
    if (!rendered.trim()) return;

    // Validate required fields before copying
    const missing = variableFormRef.current?.validate() ?? [];
    if (missing.length > 0) {
      return;
    }

    try {
      await navigator.clipboard.writeText(rendered);
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = rendered;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        return;
      }
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    const entry: PromptHistoryEntry = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      templateId: selectedId,
      templateTitle: selectedTemplate?.title ?? '',
      values: { ...values },
      rendered,
      action: 'copy_and_open',
      platformKey
    };
    setHistory(pushHistory(entry));
    const platform = PLATFORMS.find((p) => p.key === platformKey);
    notifyBrowser('已复制到 ' + (platform?.name ?? '剪贴板'), '「' + (selectedTemplate?.title ?? '') + '」');
  }

  function getCurrentTags() {
    if (!selectedId) return [];
    return templateTags[selectedId] ?? [];
  }

  function addTag() {
    const tag = tagInput.trim();
    if (!tag || !selectedId) return;
    const current = getCurrentTags();
    if (current.includes(tag)) {
      setTagInput('');
      return;
    }
    const next = { ...templateTags, [selectedId]: [...current, tag] };
    setTemplateTags(next);
    setTemplateTags((prev) => {
      const updated = { ...prev, [selectedId]: [...(prev[selectedId] ?? []), tag] };
      const allTags = loadTags();
      allTags[selectedId] = updated[selectedId];
      saveTags(allTags);
      return updated;
    });
    setTagInput('');
  }

  function removeTag(tag: string) {
    if (!selectedId) return;
    setTemplateTags((prev) => {
      const updated = { ...prev, [selectedId]: (prev[selectedId] ?? []).filter((t) => t !== tag) };
      const allTags = loadTags();
      allTags[selectedId] = updated[selectedId];
      saveTags(allTags);
      return updated;
    });
  }

  return (
    <main className="px-3 py-4 sm:px-5 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3">
        <header className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-soft dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('appTitle')}</h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('appDesc')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = lang === 'zh' ? 'en' : 'zh';
                  setLang(next);
                  safeSet(STORAGE_KEYS.LANG, next);
                }}
                className="min-h-[44px] min-w-[44px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                title={lang === 'zh' ? 'Switch to English' : '切换到中文'}
              >
                <span className="inline-block w-4 text-center">{lang === 'zh' ? 'EN' : '中'}</span>
              </button>
              <ThemeToggle />
              <p key={noticeKey} className={`h-4 overflow-hidden text-xs text-teal-700 dark:text-teal-400 ${notice ? 'notice-pop' : ''}`}>
                {notice || ''}
              </p>
            </div>
          </div>
        </header>

        {swUpdateAvailable && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-900/30">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {lang === 'zh' ? '✨ 新版本已就绪' : '✨ New version ready'}
            </p>
            <button
              type="button"
              onClick={() => {
                if (navigator.serviceWorker.controller) {
                  navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
                }
                window.location.reload();
              }}
              className="shrink-0 rounded-lg border border-amber-300 bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-amber-600 dark:bg-amber-800 dark:text-amber-200 dark:hover:bg-amber-700 min-h-[36px]"
            >
              {lang === 'zh' ? '立即刷新' : 'Refresh Now'}
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
          <aside className="w-full space-y-3 lg:flex-none lg:sticky lg:top-3 lg:w-[280px]">
            <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-soft overflow-hidden max-w-full box-border dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('templateList')}</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleUploadClick}
                    className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-700 transition hover:bg-teal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 min-h-[44px] min-w-[44px] sm:text-xs sm:py-1.5 sm:min-h-0 sm:w-auto"
                  >
                    {t('upload')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowImportUrl(true)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 min-h-[44px] min-w-[44px] sm:text-xs sm:py-1.5 sm:min-h-0 sm:w-auto dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    {t('importFromUrl')}
                  </button>
                </div>
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

              {showImportUrl && (
                <div className="mb-3 flex gap-2">
                  <input
                    type="text"
                    value={importUrlInput}
                    onChange={(e) => setImportUrlInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleImportFromUrl(); }}
                    placeholder={t('importUrlPlaceholder')}
                    className="flex-1 min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus-visible:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus-visible:border-teal-500 dark:focus-visible:ring-teal-400 sm:text-xs sm:py-1 sm:min-h-0"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleImportFromUrl}
                    className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-700 transition hover:bg-teal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 min-h-[44px] sm:text-xs sm:py-1 sm:min-h-0 dark:border-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                  >
                    {t('importUrlConfirm')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowImportUrl(false); setImportUrlInput(''); }}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 min-h-[44px] sm:text-xs sm:py-1 sm:min-h-0 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    {t('importUrlCancel')}
                  </button>
                </div>
              )}

              {batchSelectedIds.size > 0 && (
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 dark:border-rose-800 dark:bg-rose-900/30">
                  <span className="text-xs text-rose-700 dark:text-rose-300">
                    {batchSelectedIds.size}
                  </span>
                  <button
                    type="button"
                    onClick={handleBatchDeselectAll}
                    className="text-xs text-slate-600 underline hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    {t('deselectAll')}
                  </button>
                  <button
                    type="button"
                    onClick={handleBatchSelectAll}
                    className="text-xs text-slate-600 underline hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    {t('selectAll')}
                  </button>
                  <button
                    type="button"
                    onClick={handleBatchDelete}
                    className="ml-auto rounded-lg border border-rose-300 bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-1 dark:border-rose-700 dark:bg-rose-900 dark:text-rose-300 dark:hover:bg-rose-800"
                  >
                    {t('batchDelete')}
                  </button>
                </div>
              )}

              <p className="mb-3 break-words text-xs leading-5 text-slate-500">
                {t('templateNotice1')}
              </p>
              <p className="mb-3 break-words text-xs leading-5 text-slate-500">
                {t('templateNotice2')}
              </p>

              <div className="mb-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus-visible:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-400 dark:focus-visible:border-teal-500 dark:focus-visible:ring-teal-400 sm:px-3 sm:py-2 sm:text-sm"
                />
              </div>

              <div className="mb-3 -mx-1 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex gap-1.5">
                  {(Object.keys(CATEGORY_LABELS) as FilterTab[]).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setFilterTab(tab)}
                      className={`min-h-[44px] shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 ${
                        filterTab === tab
                          ? 'border-b-2 border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                          : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      {CATEGORY_LABELS[tab]}
                    </button>
                  ))}
                </div>
              </div>

              <div
                ref={templateListRef}
                className="max-h-[70vh] space-y-2 overflow-auto pr-1"
                onKeyDown={handleTemplateListKeyDown}
                role="listbox"
                aria-label="模板列表"
              >
                {filteredTemplates.map((item, idx) => {
                  const isLocal = item.source === 'local';
                  const isChecked = batchSelectedIds.has(item.id);
                  const isSelected = selectedId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 min-h-[60px] transition focus-within:ring-2 focus-within:ring-teal-400 focus-within:ring-offset-1 ${
                        isSelected
                          ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/30'
                          : isChecked && isLocal
                            ? 'border-teal-400 bg-teal-50/50 dark:bg-teal-900/20'
                            : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                      }`}
                    >
                      {isLocal ? (
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleBatchSelect(item.id)}
                          className="h-4 w-4 shrink-0 rounded border-slate-300 text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 dark:border-slate-600"
                        />
                      ) : (
                        <span className="h-4 w-4 shrink-0 rounded border border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-700" />
                      )}
                      <button
                        type="button"
                        data-template-btn
                        tabIndex={0}
                        onClick={() => handleTemplateSelect(item.id)}
                        className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 rounded"
                      >
                        <div className="flex items-center gap-1.5">
                          <p className={`truncate text-sm font-medium ${isSelected ? 'text-teal-900 dark:text-teal-300' : 'text-slate-700 dark:text-slate-300'}`}>
                            {item.title}
                          </p>
                          {favorites.includes(item.id) && (
                            <span className="shrink-0 text-amber-400 dark:text-amber-300" aria-label="已收藏">
                              ★
                            </span>
                          )}
                        </div>
                        <p className={`mt-0.5 text-xs ${isSelected ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}`}>
                          {item.source === 'builtin' ? t('builtIn') : t('local')}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(item.id)}
                        className="shrink-0 self-start rounded-md p-1.5 text-base leading-none transition hover:bg-slate-100 dark:hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                        aria-label={favorites.includes(item.id) ? '取消收藏' : '收藏'}
                        title={favorites.includes(item.id) ? '取消收藏' : '收藏'}
                      >
                        {favorites.includes(item.id) ? (
                          <span className="text-amber-400 dark:text-amber-300">★</span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">☆</span>
                        )}
                      </button>
                    </div>
                  );
                })}

                {templates.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center dark:border-slate-600">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                      <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{lang === 'zh' ? '还没有模板' : 'No templates yet'}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {lang === 'zh' ? '上传 .md 或导入分享链接开始' : 'Upload .md or import a share link to start'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleUploadClick}
                        className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-medium text-teal-700 transition hover:bg-teal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 dark:border-teal-700 dark:bg-teal-900/30 dark:text-teal-300 dark:hover:bg-teal-900/50 min-h-[44px]"
                      >
                        {t('upload')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowImportUrl(true)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 min-h-[44px]"
                      >
                        {t('importFromUrl')}
                      </button>
                    </div>
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
                    {t('noResults')}
                  </p>
                ) : null}
              </div>
            </section>

            <HistoryPanel
              entries={history}
              platforms={PLATFORMS}
              onReuse={(entry) => {
                const template = templates.find((t) => t.id === entry.templateId);
                if (!template) {
                  return;
                }
                setSelectedId(template.id);
                setDraftMarkdown(template.rawMarkdown);
                setValues(entry.values);
              }}
              onCopyAndOpen={(platformKey, url) => {
                void copyAndOpenAction(platformKey, url);
              }}
              onClear={() => {
                clearHistory();
                setHistory([]);
              }}
              labels={{
                title: t('recentHistory'),
                clear: t('clearHistory'),
                noHistory: t('noHistory'),
                copyOnly: t('copyOnlyAction'),
                copyAndOpen: t('copyAndOpenAction'),
              }}
            />
          </aside>

          <section className="flex-1 space-y-3">
            <VariableForm
              ref={variableFormRef}
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
              labels={{
                sectionTitle: t('variableSection'),
                noVariables: t('noVariables'),
                bookmarkFill: t('bookmarkFill'),
                addBookmark: t('addBookmark'),
                removeBookmark: t('removeBookmark'),
                selectPlaceholder: t('selectPlaceholder'),
                validationFailed: t('validationFailed'),
              }}
            />

            <PlatformActions
              content={rendered}
              onBeforeCopy={() => {
                const missing = variableFormRef.current?.validate() ?? [];
                return missing.length === 0;
              }}
              onAction={(action) => {
                if (!selectedTemplate || !rendered.trim()) {
                  return;
                }
                const entry: PromptHistoryEntry = {
                  id: crypto.randomUUID(),
                  createdAt: Date.now(),
                  templateId: selectedTemplate.id,
                  templateTitle: selectedTemplate.title,
                  values: { ...values },
                  rendered,
                  action: action.type,
                  platformKey: action.platformKey
                };
                setHistory(pushHistory(entry));
                const platformName = action.platformKey
                  ? PLATFORMS.find((p) => p.key === action.platformKey)?.name ?? ''
                  : '剪贴板';
                notifyBrowser(lang === 'zh' ? ('已复制到 ' + platformName) : ('Copied to ' + platformName), '「' + selectedTemplate.title + '」');
              }}
              onCopyAndOpen={copyAndOpenAction}
              labels={{
                title: t('platformActions'),
                copyOnly: t('copyOnly'),
                copiedNotice: '已复制',
                copyFailedNotice: '复制失败，请手动复制',
                copiedAndOpenNotice: '已复制并跳转',
                openWithoutCopyNotice: '已跳转（复制失败）',
              }}
            />

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('templatePreview')}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('highlightTip')}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 dark:text-slate-300">
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

              <details className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                <summary className="cursor-pointer select-none font-medium text-slate-700 dark:text-slate-300">
                  {t('advancedSettings')}
                </summary>

                <div className="mt-3 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleSaveTemplate}
                      className="min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 sm:text-xs sm:py-1.5 sm:min-h-0"
                    >
                      {t('save')}
                    </button>
                    <button
                      type="button"
                      onClick={handleExportTemplate}
                      className="min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 sm:text-xs sm:py-1.5 sm:min-h-0"
                    >
                      {t('exportMd')}
                    </button>
                    <button
                      type="button"
                      onClick={handleShareViaUrl}
                      className="min-h-[44px] rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-700 transition hover:bg-teal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 dark:border-teal-700 dark:bg-teal-900/30 dark:text-teal-300 sm:text-xs sm:py-1.5 sm:min-h-0"
                    >
                      {t('shareLink')}
                    </button>
                    <button
                      type="button"
                      onClick={handleShowQR}
                      className="min-h-[44px] rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-700 transition hover:bg-teal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 dark:border-teal-700 dark:bg-teal-900/30 dark:text-teal-300 sm:text-xs sm:py-1.5 sm:min-h-0"
                    >
                      二维码
                    </button>
                    <span className="flex items-center rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {lang === 'zh' ? `已生成 ${shareCount} 个分享链接` : `${shareCount} share links generated`}
                    </span>
                    <button
                      type="button"
                      onClick={handleDeleteTemplate}
                      className="min-h-[44px] rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs sm:py-1.5 sm:min-h-0"
                      disabled={selectedTemplate?.source !== 'local'}
                      title={selectedTemplate?.source === 'local' ? '删除当前本地模板' : '内置模板不可删除'}
                    >
                      {t('delete')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookmarkPanelOpen(true)}
                      className="min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 sm:text-xs sm:py-1.5 sm:min-h-0"
                    >
                      {lang === 'zh' ? '管理书签' : 'Manage Bookmarks'}
                    </button>
                    <button
                      type="button"
                      onClick={handleExportAllData}
                      className="min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 sm:text-xs sm:py-1.5 sm:min-h-0"
                    >
                      {t('exportAllData')}
                    </button>
                  </div>

                  {selectedId && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{t('tagManage')}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {getCurrentTags().map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs text-teal-700 dark:border-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-0.5 rounded-full p-1 min-h-[32px] min-w-[32px] flex items-center justify-center hover:text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); }}}
                          placeholder={t('tagInputPlaceholder')}
                          className="flex-1 min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus-visible:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus-visible:border-teal-500 dark:focus-visible:ring-teal-400 sm:text-xs sm:py-1 sm:min-h-0"
                        />
                        <button
                          type="button"
                          onClick={addTag}
                          className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-700 transition hover:bg-teal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 dark:border-teal-700 dark:bg-teal-900/30 dark:text-teal-300 min-h-[44px] sm:text-xs sm:py-1 sm:min-h-0"
                        >
                          {t('addTag')}
                        </button>
                      </div>
                    </div>
                  )}

                  <textarea
                    value={draftMarkdown}
                    rows={14}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base leading-6 outline-none transition focus-visible:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus-visible:border-teal-500 dark:focus-visible:ring-teal-400 sm:px-3 sm:py-2 sm:text-sm"
                    placeholder="在这里临时调整模板内容"
                    onChange={(event) => setDraftMarkdown(event.target.value)}
                  />
                </div>
              </details>

              <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                <summary className="cursor-pointer select-none font-medium text-slate-700 dark:text-slate-300">{t('advancedTip')}</summary>
                <p className="mt-2 leading-5">
                  {t('autoFillTip')}
                  {AUTO_FILL_NAMES.map((name) => ` [${name}]`).join('')}
                  {t('autoFillSuffix')}
                </p>
              </details>
            </section>
          </section>
        </div>

        <footer className="px-1 pb-1 pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          <p>{t('footer')}</p>
          <p>
            {t('pr')}（
            <a
              href="https://github.com/nbzz/PromptDock"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-teal-700 dark:text-slate-300"
            >
              GitHub: PromptDock
            </a>
            ）{t('contact')}
            <a
              href="mailto:tz@ittz.top"
              className="ml-1 font-medium text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-teal-700 dark:text-slate-300"
            >
              tz@ittz.top
            </a>
          </p>
        </footer>
        {qrModalText && (
          <QRModal
            text={qrModalText}
            onClose={() => setQrModalText('')}
            title={t('scanQRTitle')}
            tip={t('scanQRTip')}
            close={t('close')}
          />
        )}
        {bookmarkPanelOpen && (
          <BookmarkPanel
            onClose={() => setBookmarkPanelOpen(false)}
            onUpdate={() => {}}
            lang={lang}
          />
        )}
        {saveConfirmDialog && (() => {
          const { template, draftMarkdown } = saveConfirmDialog;
          const preview = draftMarkdown.slice(0, 100);
          const varCount = parsed?.variables.length ?? 0;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-200">确认保存模板</h3>
                <div className="mb-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">名称</span>
                    <span className="text-sm text-slate-700 dark:text-slate-300">{template.title}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">变量</span>
                    <span className="text-sm text-slate-700 dark:text-slate-300">{varCount} 个变量</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">预览</span>
                    <span className="text-sm text-slate-700 dark:text-slate-300 break-all">{preview}{draftMarkdown.length > 100 ? '...' : ''}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSaveConfirmDialog(null)}
                    className="min-h-[44px] rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 sm:text-xs sm:py-1.5 sm:min-h-0"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={confirmSave}
                    className="min-h-[44px] rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-sm text-teal-700 transition hover:bg-teal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 dark:border-teal-700 dark:bg-teal-900/30 dark:text-teal-300 sm:text-xs sm:py-1.5 sm:min-h-0"
                  >
                    确认保存
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {deleteConfirmDialog && (() => {
          const { template } = deleteConfirmDialog;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-sm rounded-2xl border border-rose-200 bg-white p-5 shadow-2xl dark:border-rose-700 dark:bg-slate-900">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/50">
                    <svg className="h-5 w-5 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{lang === 'zh' ? '删除模板' : 'Delete Template'}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{lang === 'zh' ? '此操作不可恢复' : 'This cannot be undone'}</p>
                  </div>
                </div>
                <p className="mb-5 text-sm text-slate-600 dark:text-slate-300">
                  {lang === 'zh'
                    ? `确定要删除本地模板「${template.title}」吗？`
                    : `Delete local template "${template.title}"?`}
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmDialog(null)}
                    className="min-h-[44px] rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {lang === 'zh' ? '取消' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    className="min-h-[44px] rounded-lg border border-rose-300 bg-rose-100 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-1 dark:border-rose-700 dark:bg-rose-900 dark:text-rose-300 dark:hover:bg-rose-800"
                  >
                    {lang === 'zh' ? '确认删除' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {batchDeleteConfirmDialog && (() => {
          const { count } = batchDeleteConfirmDialog;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-sm rounded-2xl border border-rose-200 bg-white p-5 shadow-2xl dark:border-rose-700 dark:bg-slate-900">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/50">
                    <svg className="h-5 w-5 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{lang === 'zh' ? '批量删除' : 'Batch Delete'}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{lang === 'zh' ? '此操作不可恢复' : 'This cannot be undone'}</p>
                  </div>
                </div>
                <p className="mb-5 text-sm text-slate-600 dark:text-slate-300">
                  {lang === 'zh'
                    ? `确定要删除选中的 ${count} 个本地模板吗？`
                    : `Delete ${count} selected local templates?`}
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setBatchDeleteConfirmDialog(null)}
                    className="min-h-[44px] rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {lang === 'zh' ? '取消' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={confirmBatchDelete}
                    className="min-h-[44px] rounded-lg border border-rose-300 bg-rose-100 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-1 dark:border-rose-700 dark:bg-rose-900 dark:text-rose-300 dark:hover:bg-rose-800"
                  >
                    {lang === 'zh' ? '确认删除' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </main>
  );
}
