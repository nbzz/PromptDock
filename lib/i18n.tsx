'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type Locale = 'zh' | 'en';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'promptdock-locale';

const translations: Record<Locale, Record<string, string>> = {
  zh: {
    // Header
    'app.subtitle': '配置一套提示词，在所有 AI 平台快速调用',
    // Template list
    'template.list': '模板列表',
    'template.import': '导入',
    'template.selectOrImport': '选择或导入模板',
    'template.builtin': '内置模板',
    'template.local': '本地模板',
    'template.empty': '还没有模板',
    'template.emptyHint': '点击上方「导入」按钮添加模板文件（.md）',
    'template.bodyHint': '模板正文可直接使用，不需要固定开场语法；系统仅识别 [] 作为变量占位符。',
    // Notice messages
    'notice.imported': '模板已导入',
    'notice.savedCopy': '已另存为本地模板副本',
    'notice.saved': '模板已保存',
    'notice.exported': '模板已导出为 Markdown',
    'notice.cannotDeleteBuiltin': '内置模板不支持删除',
    'notice.deleted': '本地模板已删除',
    'notice.copied': '已复制',
    'notice.copyFailed': '复制失败，请手动复制',
    'notice.copiedAndOpened': '已复制并跳转',
    'notice.openedCopyFailed': '已跳转（复制失败）',
    // Template & Preview
    'preview.title': '模板与预览',
    'preview.filledHighlight': '高亮部分为已填充变量',
    'preview.save': '保存',
    'preview.exportMd': '导出 Markdown',
    'preview.delete': '删除',
    'preview.builtinCannotDelete': '内置模板不可删除',
    'preview.adjustHint': '在这里临时调整模板内容',
    // Auto variables
    'autoVars.title': '自动变量（可选）',
    'autoVars.hint': '系统会自动填充以下 [] 内容，无需手动填写；其他所有 [] 都按手动输入处理。',
    // Platform actions
    'platform.title': '快捷动作（复制并跳转）',
    'platform.copyOnly': '仅复制',
    // Variable form
    'vars.title': '变量填写',
    'vars.noVariables': '这个模板没有变量，直接可用。',
    'vars.pleaseSelect': '请选择',
    // History
    'history.title': '最近使用',
    'history.clear': '清空',
    'history.empty': '还没有历史记录。',
    'history.copyOnly': '仅复制',
    'history.copyAndOpen': '复制并打开',
    // Stock status
    'stock.sourceFallback': '兜底数据',
    'stock.sourcePartial': '在线+兜底',
    'stock.sourceOnline': '在线数据',
    // Footer
    'footer.contribute': '公共模板投稿：Pull Request（',
    // Misc
    'confirm.delete': '确认删除本地模板',
  },
  en: {
    // Header
    'app.subtitle': 'Configure prompts and copy to any AI platform instantly',
    // Template list
    'template.list': 'Templates',
    'template.import': 'Import',
    'template.selectOrImport': 'Select or import a template',
    'template.builtin': 'Built-in',
    'template.local': 'Local',
    'template.empty': 'No templates yet',
    'template.emptyHint': 'Click "Import" above to add a template file (.md)',
    'template.bodyHint': 'Templates work as-is — no fixed preamble needed; only [] is recognized as variable placeholder.',
    // Notice messages
    'notice.imported': 'Template imported',
    'notice.savedCopy': 'Saved as local copy',
    'notice.saved': 'Template saved',
    'notice.exported': 'Template exported as Markdown',
    'notice.cannotDeleteBuiltin': 'Built-in templates cannot be deleted',
    'notice.deleted': 'Local template deleted',
    'notice.copied': 'Copied',
    'notice.copyFailed': 'Copy failed, please copy manually',
    'notice.copiedAndOpened': 'Copied & opened',
    'notice.openedCopyFailed': 'Opened (copy failed)',
    // Template & Preview
    'preview.title': 'Template & Preview',
    'preview.filledHighlight': 'Highlighted parts are filled variables',
    'preview.save': 'Save',
    'preview.exportMd': 'Export Markdown',
    'preview.delete': 'Delete',
    'preview.builtinCannotDelete': 'Built-in templates cannot be deleted',
    'preview.adjustHint': 'Temporarily adjust template content here',
    // Auto variables
    'autoVars.title': 'Auto Variables (Optional)',
    'autoVars.hint': 'System auto-fills these [] — no manual input needed; all other [] are treated as manual input.',
    // Platform actions
    'platform.title': 'Copy & Open',
    'platform.copyOnly': 'Copy Only',
    // Variable form
    'vars.title': 'Fill Variables',
    'vars.noVariables': 'This template has no variables — ready to use.',
    'vars.pleaseSelect': 'Please select',
    // History
    'history.title': 'Recent',
    'history.clear': 'Clear',
    'history.empty': 'No history yet.',
    'history.copyOnly': 'Copy only',
    'history.copyAndOpen': 'Copy & open',
    // Stock status
    'stock.sourceFallback': 'Fallback data',
    'stock.sourcePartial': 'Online + Fallback',
    'stock.sourceOnline': 'Live data',
    // Footer
    'footer.contribute': 'Contribute templates: Pull Request（',
    // Misc
    'confirm.delete': 'Delete local template',
  },
};

function getNestedTranslation(locale: Locale, key: string): string {
  const parts = key.split('.');
  let value: unknown = translations[locale];
  for (const part of parts) {
    if (typeof value !== 'object' || value === null) {
      return key;
    }
    value = (value as Record<string, unknown>)[part];
  }
  return typeof value === 'string' ? value : key;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('zh');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'zh' || stored === 'en') {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: string): string => getNestedTranslation(locale, key),
    [locale]
  );

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}
