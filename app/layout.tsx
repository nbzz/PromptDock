import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'PromptDock - 你的 AI 提示词管理器',
  description: '导入提示词模板、可视化填写变量、一键复制并跳转到 ChatGPT/Claude 等 AI 平台。支持股票代码自动补全、书签收藏、多语言切换。',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg'
  },
  openGraph: {
    title: 'PromptDock',
    description: 'AI 提示词可视化填写与分享',
    type: 'website',
    locale: 'zh_CN'
  },
  keywords: ['AI', 'Prompt', '提示词', 'ChatGPT', 'Claude', '模板', '变量填写']
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}var l=localStorage.getItem('lang');if(l==='en'){document.documentElement.lang='en';}})()`
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
