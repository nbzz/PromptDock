export interface Platform {
  key: string;
  name: string;
  url: string;
  icon: string;
}

export const PLATFORMS: Platform[] = [
  {
    key: 'perplexity',
    name: 'Perplexity',
    url: 'https://www.perplexity.ai/',
    icon: '/icons/platforms/perplexity.svg'
  },
  { key: 'grok', name: 'Grok', url: 'https://x.com/i/grok', icon: '/icons/platforms/grok.svg' },
  {
    key: 'openai',
    name: 'OpenAI',
    url: 'https://chat.openai.com/',
    icon: '/icons/platforms/openai.svg'
  },
  {
    key: 'gemini',
    name: 'Gemini',
    url: 'https://gemini.google.com/app',
    icon: '/icons/platforms/gemini.svg'
  },
  { key: 'claude', name: 'Claude', url: 'https://claude.ai/new', icon: '/icons/platforms/claude.svg' },
  {
    key: 'yuanbao',
    name: '元宝',
    url: 'https://yuanbao.tencent.com/',
    icon: '/icons/platforms/yuanbao.svg'
  },
  {
    key: 'deepseek',
    name: 'DeepSeek',
    url: 'https://chat.deepseek.com/',
    icon: '/icons/platforms/deepseek.svg'
  },
  { key: 'kimi', name: 'Kimi', url: 'https://kimi.moonshot.cn/', icon: '/icons/platforms/kimi.svg' },
  {
    key: 'doubao',
    name: '豆包',
    url: 'https://www.doubao.com/chat/',
    icon: '/icons/platforms/doubao.svg'
  }
];
