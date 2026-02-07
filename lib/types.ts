export type VariableType =
  | 'text'
  | 'textarea'
  | 'stock'
  | 'date'
  | 'time'
  | 'datetime'
  | 'number'
  | 'select';

export type AutoFillKind =
  | 'date'
  | 'time'
  | 'datetime'
  | 'weekday'
  | 'month'
  | 'quarter'
  | 'timestamp'
  | 'trading_day';

export interface VariableMeta {
  type?: VariableType;
  required?: boolean;
  default?: string;
  placeholder?: string;
  hint?: string;
  options?: string[];
  autoFill?: AutoFillKind;
}

export interface ParsedVariable extends VariableMeta {
  id: string;
  name: string;
  value: string;
}

export interface FrontmatterShape {
  title?: string;
  description?: string;
  variables?:
    | Record<string, VariableMeta>
    | Array<
        {
          id: string;
        } & VariableMeta
      >;
  tags?: string[];
}

export interface ParsedTemplate {
  id: string;
  title: string;
  description?: string;
  content: string;
  rawMarkdown: string;
  frontmatter: FrontmatterShape;
  variables: ParsedVariable[];
}

export interface StoredTemplate {
  id: string;
  title: string;
  rawMarkdown: string;
  source: 'builtin' | 'local';
  updatedAt: number;
}

export interface StockItem {
  code: string;
  name: string;
  market: 'CN' | 'HK' | 'US';
  aliases: string[];
}

export interface StockQueryResult {
  item: StockItem;
  score: number;
}

export interface StockFetchResult {
  items: StockItem[];
  usedFallback: boolean;
  partialFallback: boolean;
  updatedAt: string;
  marketCounts: {
    CN: number;
    HK: number;
    US: number;
  };
}

export interface PromptHistoryEntry {
  id: string;
  createdAt: number;
  templateId: string;
  templateTitle: string;
  values: Record<string, string>;
  rendered: string;
  action: 'copy_only' | 'copy_and_open';
  platformKey?: string;
}

// 预留给未来模板市场（当前不在页面展示）
export interface TemplateRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  visibility: 'public' | 'private';
  authorId?: string;
  createdAt: string;
  updatedAt: string;
}

// 预留：模板版本记录
export interface TemplateVersionRecord {
  id: string;
  templateId: string;
  version: number;
  content: string;
  changelog?: string;
  createdAt: string;
}

// 预留：标签结构
export interface TemplateTagRecord {
  id: string;
  name: string;
  slug: string;
}
