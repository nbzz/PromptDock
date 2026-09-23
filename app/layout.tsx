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
    // suppressHydrationWarning: 下面 head 里的内联脚本会在 hydration 之前改写
    // <html> 的 class（暗色模式）与 lang（语言），服务端无从得知，必然产生属性差异。
    // 这是主题闪烁防护的标准做法，需要在此显式抑制该元素的属性告警。
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            // lang 由 safeSet 写入，是 JSON 字符串（"en"），这里先 JSON.parse 再比较，
            // 否则永远匹配不上，<html lang> 会一直停留在 zh-CN
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}var raw=localStorage.getItem('lang'),l=raw;try{l=JSON.parse(raw)}catch(e){}if(l==='en'){document.documentElement.lang='en';}}catch(e){}})()`
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
