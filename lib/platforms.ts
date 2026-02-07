export interface Platform {
  key: string;
  name: string;
  url: string;
}

export const PLATFORMS: Platform[] = [
  { key: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai/' },
  { key: 'grok', name: 'Grok', url: 'https://x.com/i/grok' },
  { key: 'openai', name: 'OpenAI', url: 'https://chat.openai.com/' },
  { key: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/app' },
  { key: 'claude', name: 'Claude', url: 'https://claude.ai/new' },
  { key: 'yuanbao', name: '元宝', url: 'https://yuanbao.tencent.com/' },
  { key: 'deepseek', name: 'DeepSeek', url: 'https://chat.deepseek.com/' },
  { key: 'kimi', name: 'Kimi', url: 'https://kimi.moonshot.cn/' },
  { key: 'doubao', name: '豆包', url: 'https://www.doubao.com/chat/' }
];

export function getPlatformIcon(url: string): string {
  return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(url)}`;
}
