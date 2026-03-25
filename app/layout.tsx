import type { Metadata } from 'next';
import './globals.css';
import { I18nProvider } from '@/lib/i18n';

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
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
