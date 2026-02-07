import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'PromptDock',
  description: 'Prompt 导入、变量可视化填写、复制并跳转 AI 平台',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
