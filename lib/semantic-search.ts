/**
 * Semantic Search Engine — TF-IDF based
 *
 * Lightweight client-side semantic search for templates.
 * Uses TF-IDF vectorization with cosine similarity.
 * Pre-computed document vectors are cached in localStorage.
 */

import { StoredTemplate } from '@/lib/types';

export interface SearchResult {
  template: StoredTemplate;
  score: number;
  matchType: 'semantic' | 'keyword' | 'hybrid';
}

// --- Tokenization ---

function tokenize(text: string): string[] {
  // Remove code blocks and inline code
  let clean = text.replace(/```[\s\S]*?```/g, ' ');
  clean = clean.replace(/`[^`\n]+`/g, ' ');
  // Remove frontmatter
  clean = clean.replace(/^---[\s\S]*?---\r?\n?/m, ' ');
  // Remove special chars but keep CJK characters
  clean = clean.replace(/[^\p{L}\p{N}\s\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/gu, ' ');

  const tokens: string[] = [];
  const chineseChars: string[] = [];
  let prevIsChinese = false;

  for (const char of clean) {
    const isChinese = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/.test(char);
    if (isChinese) {
      if (prevIsChinese) {
        chineseChars[chineseChars.length - 1] += char;
      } else {
        chineseChars.push(char);
      }
      prevIsChinese = true;
    } else {
      if (prevIsChinese && chineseChars.length > 0) {
        tokens.push(...chineseChars.splice(0));
      }
      prevIsChinese = false;
    }
  }
  if (chineseChars.length > 0) {
    tokens.push(...chineseChars);
  }

  // Also extract English/number words
  const words = clean.split(/\s+/).filter((w) => w.length > 1);
  tokens.push(...words);

  return tokens.filter((t) => t.length > 0);
}

// --- TF-IDF Core ---

interface DocumentVector {
  [term: string]: number;
}

interface CorpusVectors {
  templateId: string;
  vector: DocumentVector;
}

interface TfIdfIndex {
  documentVectors: CorpusVectors[];
  idf: { [term: string]: number };
  vocab: string[];
}

const EMBEDDINGS_KEY = 'promptdock.embeddings.v1';

function computeTf(tokens: string[]): DocumentVector {
  const tf: DocumentVector = {};
  for (const token of tokens) {
    tf[token] = (tf[token] ?? 0) + 1;
  }
  const max = Math.max(...Object.values(tf), 1);
  for (const key in tf) {
    tf[key] = tf[key] / max;
  }
  return tf;
}

function computeIdf(documents: string[][]): { [term: string]: number } {
  const df: { [term: string]: number } = {};
  const N = documents.length;
  for (const doc of documents) {
    const seen = new Set<string>();
    for (const token of doc) {
      if (!seen.has(token)) {
        df[token] = (df[token] ?? 0) + 1;
        seen.add(token);
      }
    }
  }
  const idf: { [term: string]: number } = {};
  for (const term in df) {
    idf[term] = Math.log((N + 1) / (df[term] + 1)) + 1;
  }
  return idf;
}

function tfidfVector(tf: DocumentVector, idf: { [term: string]: number }): DocumentVector {
  const vec: DocumentVector = {};
  for (const term in tf) {
    vec[term] = tf[term] * (idf[term] ?? 1);
  }
  return vec;
}

function cosineSimilarity(a: DocumentVector, b: DocumentVector): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const vocab = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const term of vocab) {
    const va = a[term] ?? 0;
    const vb = b[term] ?? 0;
    dot += va * vb;
    normA += va * va;
    normB += vb * vb;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

function documentContent(template: StoredTemplate): string {
  return `${template.title} ${template.rawMarkdown}`;
}

// --- Index Storage ---

export function buildIndex(templates: StoredTemplate[]): TfIdfIndex {
  const tokenized = templates.map((t) => tokenize(documentContent(t)));
  const idf = computeIdf(tokenized);
  const documentVectors: CorpusVectors[] = templates.map((t, i) => ({
    templateId: t.id,
    vector: tfidfVector(computeTf(tokenized[i]), idf)
  }));
  const vocab = Object.keys(idf);
  return { documentVectors, idf, vocab };
}

export function saveIndex(index: TfIdfIndex): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(EMBEDDINGS_KEY, JSON.stringify(index));
  } catch {
    // Storage full or unavailable
  }
}

export function loadIndex(): TfIdfIndex | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(EMBEDDINGS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TfIdfIndex;
  } catch {
    return null;
  }
}

// --- Semantic Search ---

export function semanticSearch(
  query: string,
  templates: StoredTemplate[],
  index: TfIdfIndex,
  options: { topK?: number; keywordBoost?: number } = {}
): SearchResult[] {
  const { topK = 10, keywordBoost = 2.0 } = options;
  if (!query.trim() || templates.length === 0) {
    return templates.slice(0, topK).map((t) => ({ template: t, score: 0, matchType: 'keyword' as const }));
  }

  const queryTokens = tokenize(query);
  const queryTf = computeTf(queryTokens);
  const queryVec = tfidfVector(queryTf, index.idf);

  const results: SearchResult[] = [];

  for (const dv of index.documentVectors) {
    const template = templates.find((t) => t.id === dv.templateId);
    if (!template) continue;

    const semanticScore = cosineSimilarity(queryVec, dv.vector);

    // Keyword match score: check how many query terms appear in the doc
    let keywordScore = 0;
    const docTokens = new Set(tokenize(documentContent(template)));
    for (const token of queryTokens) {
      if (docTokens.has(token)) keywordScore += 1;
    }
    keywordScore = queryTokens.length > 0 ? keywordScore / queryTokens.length : 0;

    // Hybrid score
    const hybridScore = semanticScore * 0.6 + keywordScore * keywordBoost * 0.4;

    results.push({
      template,
      score: hybridScore,
      matchType: keywordScore > 0.8 ? 'keyword' : semanticScore > 0.1 ? 'semantic' : 'hybrid'
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}

// --- Index Management ---

export function reindexTemplates(templates: StoredTemplate[]): TfIdfIndex {
  const index = buildIndex(templates);
  saveIndex(index);
  return index;
}

export function getOrCreateIndex(templates: StoredTemplate[]): TfIdfIndex {
  const cached = loadIndex();
  if (cached && cached.documentVectors.length === templates.length) {
    return cached;
  }
  return reindexTemplates(templates);
}
