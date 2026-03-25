import yaml from 'js-yaml';
import { extractVariableNames } from '@/lib/template-parser';

export interface TemplateDoc {
  id: string;
  title: string;
  description: string;
  variables: VariableDoc[];
  content: string;
  rawMarkdown: string;
  usageExample?: string;
}

export interface VariableDoc {
  name: string;
  type: string;
  required: boolean;
  placeholder?: string;
  hint?: string;
  options?: string[];
  defaultValue?: string;
}

function parseFrontmatter(markdown: string): {
  frontmatter: Record<string, unknown>;
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
      return { frontmatter: parsed as Record<string, unknown>, content };
    }
  } catch {
    // ignore
  }
  return { frontmatter: {}, content: markdown };
}

function getVariableType(meta: Record<string, unknown>): string {
  if (meta.type) return String(meta.type);
  return 'text';
}

function getVariableOptions(meta: Record<string, unknown>): string[] | undefined {
  if (Array.isArray(meta.options)) {
    return meta.options.map(String);
  }
  return undefined;
}

export function generateDocFromMarkdown(
  id: string,
  rawMarkdown: string,
  title?: string
): TemplateDoc {
  const { frontmatter, content } = parseFrontmatter(rawMarkdown);

  const docTitle =
    (frontmatter.title as string)?.trim() ||
    title ||
    extractTitleFromContent(content) ||
    '未命名模板';

  const description = (frontmatter.description as string) || '';

  // Parse variables from frontmatter
  const metaVars = frontmatter.variables as Record<string, Record<string, unknown>> | undefined;
  const variableDocs: VariableDoc[] = [];

  if (metaVars && typeof metaVars === 'object') {
    for (const [name, meta] of Object.entries(metaVars)) {
      variableDocs.push({
        name,
        type: getVariableType(meta),
        required: Boolean(meta.required),
        placeholder: meta.placeholder as string | undefined,
        hint: meta.hint as string | undefined,
        options: getVariableOptions(meta),
        defaultValue: meta.default as string | undefined
      });
    }
  }

  // Extract variables from content placeholders
  const contentVars = extractVariableNames(content);
  const existingNames = new Set(variableDocs.map((v) => v.name));
  for (const name of contentVars) {
    if (!existingNames.has(name)) {
      variableDocs.push({
        name,
        type: 'text',
        required: false
      });
    }
  }

  return {
    id,
    title: docTitle,
    description,
    variables: variableDocs,
    content,
    rawMarkdown
  };
}

function extractTitleFromContent(content: string): string | undefined {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim();
}

export function generateUsageExample(doc: TemplateDoc): string {
  const parts: string[] = [];

  if (doc.description) {
    parts.push(`## 用途\n${doc.description}\n`);
  }

  if (doc.variables.length > 0) {
    parts.push('## 变量说明\n');
    for (const v of doc.variables) {
      const typeTag = v.required ? '[必需]' : '[可选]';
      const optionsStr = v.options ? ` (${v.options.join(' | ')})` : '';
      const defaultStr = v.defaultValue ? ` 默认: ${v.defaultValue}` : '';
      parts.push(`- **${v.name}** ${typeTag}${optionsStr}${defaultStr}`);
      if (v.placeholder) {
        parts.push(`  - 占位符: \`${v.placeholder}\``);
      }
      if (v.hint) {
        parts.push(`  - 说明: ${v.hint}`);
      }
    }
    parts.push('');
  }

  parts.push('## 使用示例\n');
  parts.push('```\n');
  let example = doc.rawMarkdown;
  for (const v of doc.variables) {
    example = example.replace(`[${v.name}]`, v.placeholder || `{{${v.name}}}`);
  }
  parts.push(example);
  parts.push('```\n');

  return parts.join('\n');
}

export function generateMarkdownDoc(doc: TemplateDoc): string {
  const lines: string[] = [];

  lines.push(`# ${doc.title}`);
  lines.push('');

  if (doc.description) {
    lines.push(doc.description);
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  lines.push('## 变量');
  lines.push('');
  if (doc.variables.length === 0) {
    lines.push('_无_');
  } else {
    for (const v of doc.variables) {
      const requiredTag = v.required ? '🔴' : '🟡';
      lines.push(`### ${requiredTag} ${v.name}`);
      lines.push('');
      lines.push(`- **类型**: ${v.type}`);
      lines.push(`- **必填**: ${v.required ? '是' : '否'}`);
      if (v.placeholder) {
        lines.push(`- **占位符**: \`${v.placeholder}\``);
      }
      if (v.hint) {
        lines.push(`- **说明**: ${v.hint}`);
      }
      if (v.options && v.options.length > 0) {
        lines.push(`- **选项**: ${v.options.join(' | ')}`);
      }
      if (v.defaultValue) {
        lines.push(`- **默认值**: ${v.defaultValue}`);
      }
      lines.push('');
    }
  }

  lines.push('---');
  lines.push('');

  lines.push('## 模板内容');
  lines.push('');
  lines.push('```markdown');
  lines.push(doc.content);
  lines.push('```');
  lines.push('');

  lines.push('---');
  lines.push('');
  lines.push(`_由 PromptDock 文档生成器自动生成_`);

  return lines.join('\n');
}

export function generateHtmlDoc(doc: TemplateDoc): string {
  const varRows = doc.variables
    .map((v) => {
      const requiredTag = v.required
        ? '<span class="tag tag-required">必填</span>'
        : '<span class="tag tag-optional">可选</span>';
      const optionsStr = v.options ? `<tr><th>选项</th><td>${v.options.join(' | ')}</td></tr>` : '';
      const defaultStr = v.defaultValue
        ? `<tr><th>默认值</th><td><code>${v.defaultValue}</code></td></tr>`
        : '';
      const hintStr = v.hint ? `<tr><th>说明</th><td>${v.hint}</td></tr>` : '';

      return `
        <table class="var-table">
          <tr><th>变量名</th><td><code>${escapeHtml(v.name)}</code> ${requiredTag}</td></tr>
          <tr><th>类型</th><td>${escapeHtml(v.type)}</td></tr>
          ${optionsStr}
          ${defaultStr}
          ${hintStr}
        </table>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(doc.title)} - PromptDock 文档</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      background: #fafafa;
    }
    h1 { font-size: 1.8rem; margin-bottom: 0.5rem; color: #1a1a1a; }
    h2 { font-size: 1.3rem; margin: 2rem 0 1rem; color: #333; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
    h3 { font-size: 1.1rem; margin: 1.5rem 0 0.5rem; color: #444; }
    .description { color: #666; margin-bottom: 1rem; font-size: 1.05rem; }
    .divider { border: none; border-top: 1px solid #eee; margin: 2rem 0; }
    .var-section { margin-bottom: 2rem; }
    .var-table { width: 100%; border-collapse: collapse; margin-bottom: 0.5rem; font-size: 0.95rem; }
    .var-table th, .var-table td { padding: 0.5rem; text-align: left; border-bottom: 1px solid #eee; }
    .var-table th { width: 100px; color: #666; font-weight: 500; }
    .tag { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; margin-left: 0.5rem; }
    .tag-required { background: #fee; color: #c00; }
    .tag-optional { background: #ffe; color: #a80; }
    code { background: #f5f5f5; padding: 0.15rem 0.4rem; border-radius: 3px; font-family: 'SF Mono', Monaco, monospace; font-size: 0.9em; }
    .content-preview { background: #fff; padding: 1rem; border-radius: 8px; border: 1px solid #eee; white-space: pre-wrap; font-size: 0.9rem; overflow-x: auto; }
    .footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #eee; color: #999; font-size: 0.85rem; text-align: center; }
  </style>
</head>
<body>
  <h1>${escapeHtml(doc.title)}</h1>
  ${doc.description ? `<p class="description">${escapeHtml(doc.description)}</p>` : ''}

  <hr class="divider">

  <h2>变量说明</h2>
  ${doc.variables.length === 0 ? '<p><em>无</em></p>' : ''}
  ${doc.variables.map((v, i) => `
    <h3><code>${escapeHtml(v.name)}</code></h3>
    <table class="var-table">
      <tr><th>类型</th><td>${escapeHtml(v.type)}</td></tr>
      <tr><th>必填</th><td>${v.required ? '是' : '否'}</td></tr>
      ${v.placeholder ? `<tr><th>占位符</th><td><code>${escapeHtml(v.placeholder)}</code></td></tr>` : ''}
      ${v.options && v.options.length > 0 ? `<tr><th>选项</th><td>${v.options.map((o) => `<code>${escapeHtml(o)}</code>`).join(' | ')}</td></tr>` : ''}
      ${v.defaultValue ? `<tr><th>默认值</th><td><code>${escapeHtml(v.defaultValue)}</code></td></tr>` : ''}
      ${v.hint ? `<tr><th>说明</th><td>${escapeHtml(v.hint)}</td></tr>` : ''}
    </table>
  `).join('')}

  <hr class="divider">

  <h2>模板内容</h2>
  <pre class="content-preview">${escapeHtml(doc.content)}</pre>

  <div class="footer">
    由 PromptDock 文档生成器自动生成
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export type DocFormat = 'html' | 'markdown' | 'json';

export function formatDoc(doc: TemplateDoc, format: DocFormat): string {
  switch (format) {
    case 'html':
      return generateHtmlDoc(doc);
    case 'markdown':
      return generateMarkdownDoc(doc);
    case 'json':
      return JSON.stringify(doc, null, 2);
  }
}
