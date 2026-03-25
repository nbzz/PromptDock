export interface Shortcut {
  key: string;
  modifiers?: ('cmd' | 'ctrl' | 'shift' | 'alt')[];
  action: () => void;
  description: string;
}

export const SHORTCUTS: Shortcut[] = [
  { key: 'k', modifiers: ['cmd'], action: () => {}, description: '聚焦搜索' },
  { key: 'Enter', modifiers: ['cmd'], action: () => {}, description: '复制提示词' },
  { key: 's', modifiers: ['cmd'], action: () => {}, description: '保存模板' },
  { key: 'Escape', action: () => {}, description: '关闭高级设置' },
];
