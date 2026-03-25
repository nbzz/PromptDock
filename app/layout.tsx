import type { Metadata } from 'next';
<<<<<<< HEAD

import { ThemeProvider } from '@/components/theme-provider';
=======
>>>>>>> origin/main
import './globals.css';
import { I18nProvider, isRTL } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'PromptDock',
  description: 'Prompt 导入、变量可视化填写、复制并跳转 AI 平台',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg'
  }
};

function getStoredLocale(): string {
  if (typeof window === 'undefined') return 'zh';
  return localStorage.getItem('promptdock-locale') || 'zh';
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // SSR fallback, client will override via I18nProvider
  const locale = getStoredLocale();
  const dir = isRTL(locale as 'zh' | 'en' | 'ar' | 'he') ? 'rtl' : 'ltr';

  return (
<<<<<<< HEAD
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
=======
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body>
        <I18nProvider>{children}</I18nProvider>
>>>>>>> origin/main
      </body>
    </html>
  );
}
