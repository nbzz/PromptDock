import yaml from 'js-yaml';
import { executeAutoFill, inferVariableMetaByName } from '@/lib/auto-fill';
import {
  FrontmatterShape,
  ParsedTemplate,
  ParsedVariable,
  StoredTemplate,
  VariableMeta
} from '@/lib/types';

const PLACEHOLDER_RE = /\[([^\[\]\n]{1,40})\](?!\()/g;
const CODE_FENCE_RE = /```[\s\S]*?```/g;
const INLINE_CODE_RE = /`[^`\n]+`/g;
const IGNORED_PLACEHOLDER_NAMES = new Set([
  'google_search',
  'model_config',
  'instruction',
  'fusion_strategy',
  'visual_elements',
  'text_rendering',
  'style_config'
]);

export interface PromptSegment {
  text: string;
  isFilled: boolean;
  variableName?: string;
}

function sanitizeForVariableScan(content: string): string {
  return content.replace(CODE_FENCE_RE, '\n').replace(INLINE_CODE_RE, '');
}

function isValidPlaceholderName(raw: string): boolean {
  const name = raw.trim();
  if (!name || name.length > 24) {
    return false;
  }

  if (name.length === 1 && /^[xX*]$/.test(name)) {
    return false;
  }

  if (IGNORED_PLACEHOLDER_NAMES.has(name)) {
    return false;
  }

  // 仅保留常见变量命名字符，避免把 JSON/示例语法误识别为变量。
  if (!/^[\p{L}\p{N}\s_\-·（）()]+$/u.test(name)) {
    return false;
  }

  return true;
}

function parseFrontmatter(markdown: string): {
  frontmatter: FrontmatterShape;
  content: string;
} {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return { frontmatter: {}, content: markdown };
  }

  const raw = match[1];
  const content = markdown.slice(match[0].length);

  try {
    const parsed = yaml.load(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        frontmatter: parsed as FrontmatterShape,
        content
      };
    }
  } catch {
    // YAML 格式有问题时，降级为无 frontmatter
  }

  return { frontmatter: {}, content: markdown };
}

function normalizeVariableMeta(
  input: FrontmatterShape['variables']
): Record<string, VariableMeta> {
  if (!input) {
    return {};
  }

  if (Array.isArray(input)) {
    return input.reduce<Record<string, VariableMeta>>((acc, item) => {
      if (!item?.id) {
        return acc;
      }
      const { id, ...rest } = item;
      acc[id] = rest;
      return acc;
    }, {});
  }

  return input;
}

function detectTitle(content: string): string {
  const firstHeading = content.match(/^#\s+(.+)$/m);
  if (firstHeading?.[1]) {
    return firstHeading[1].trim();
  }

  return '未命名模板';
}

export function extractVariableNames(content: string): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  const scanContent = sanitizeForVariableScan(content);

  for (const match of scanContent.matchAll(PLACEHOLDER_RE)) {
    const value = match[1]?.trim();
    if (!value || !isValidPlaceholderName(value) || seen.has(value)) {
      continue;
    }

    seen.add(value);
    output.push(value);
  }

  return output;
}

export function parseTemplate(input: StoredTemplate): ParsedTemplate {
  const { frontmatter, content } = parseFrontmatter(input.rawMarkdown);
  const metaMap = normalizeVariableMeta(frontmatter.variables);

  const names = new Set<string>();
  for (const name of extractVariableNames(content)) {
    names.add(name);
  }
  for (const name of Object.keys(metaMap)) {
    names.add(name);
  }

  const variables: ParsedVariable[] = [...names].map((name) => {
    const fromName = inferVariableMetaByName(name);
    const fromMeta = metaMap[name] ?? {};

    const merged = {
      ...fromName,
      ...fromMeta
    };

    const value =
      fromMeta.default ??
      (merged.autoFill ? executeAutoFill(merged.autoFill) : '');

    return {
      id: name,
      name,
      type: merged.type ?? 'text',
      required: Boolean(merged.required),
      placeholder: merged.placeholder,
      hint: merged.hint,
      options: merged.options,
      autoFill: merged.autoFill,
      value
    };
  });

  return {
    id: input.id,
    title: frontmatter.title?.trim() || input.title || detectTitle(content),
    description: frontmatter.description,
    content,
    rawMarkdown: input.rawMarkdown,
    frontmatter,
    variables
  };
}

export function renderPrompt(templateContent: string, values: Record<string, string>): string {
  return renderPromptSegments(templateContent, values)
    .map((segment) => segment.text)
    .join('');
}

export function renderPromptSegments(
  templateContent: string,
  values: Record<string, string>
): PromptSegment[] {
  const segments: PromptSegment[] = [];
  let lastIndex = 0;

  for (const match of templateContent.matchAll(PLACEHOLDER_RE)) {
    const full = match[0];
    const rawName = match[1];
    const start = match.index ?? 0;
    const end = start + full.length;

    if (start > lastIndex) {
      segments.push({
        text: templateContent.slice(lastIndex, start),
        isFilled: false
      });
    }

    const name = String(rawName).trim();
    const value = values[name];

    if (value && value.length > 0) {
      segments.push({
        text: value,
        isFilled: true,
        variableName: name
      });
    } else {
      segments.push({
        text: `[${name}]`,
        isFilled: false,
        variableName: name
      });
    }

    lastIndex = end;
  }

  if (lastIndex < templateContent.length) {
    segments.push({
      text: templateContent.slice(lastIndex),
      isFilled: false
    });
  }

  return segments;
}

export function buildMarkdownExport(parsed: ParsedTemplate): string {
  const meta: FrontmatterShape = {
    ...parsed.frontmatter,
    title: parsed.title,
    variables: parsed.variables.reduce<Record<string, VariableMeta>>((acc, item) => {
      acc[item.name] = {
        type: item.type,
        required: item.required,
        default: item.value || undefined,
        placeholder: item.placeholder,
        hint: item.hint,
        options: item.options,
        autoFill: item.autoFill
      };
      return acc;
    }, {})
  };

  const rawMeta = yaml.dump(meta, {
    lineWidth: 120,
    noRefs: true,
    sortKeys: false
  });

  return `---\n${rawMeta}---\n${parsed.content}`;
}
