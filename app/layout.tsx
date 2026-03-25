import type { Metadata } from 'next';

import './globals.css';

const BASE_URL = 'https://promptdock.top';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'PromptDock - AI 提示词工作台 | 变量可视化填写与快速跳转',
    template: '%s | PromptDock'
  },
  description:
    'PromptDock 是一款免费在线 AI 提示词工作台，支持模板导入、变量可视化填写、一键复制并跳转到 ChatGPT、Claude、DeepSeek、豆包等主流 AI 平台。内置金融分析、内容创作等多种模板，让提示词管理更高效。',
  keywords: [
    'PromptDock',
    'AI提示词',
    '提示词工作台',
    '提示词模板',
    '变量填写',
    'ChatGPT提示词',
    'Claude提示词',
    'DeepSeek提示词',
    'AI写作模板',
    '个股分析提示词',
    '金融分析提示词',
    '提示词管理',
    'AI工具',
    '提示词分享'
  ],
  authors: [{ name: 'cyberteng', url: 'https://github.com/nbzz/PromptDock' }],
  creator: 'cyberteng',
  publisher: 'PromptDock',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  alternates: {
    canonical: BASE_URL
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: BASE_URL,
    siteName: 'PromptDock',
    title: 'PromptDock - AI 提示词工作台 | 变量可视化填写与快速跳转',
    description:
      '免费在线 AI 提示词工作台，支持模板导入、变量可视化填写、一键跳转到 ChatGPT、Claude、DeepSeek 等主流 AI 平台。'
  },
  twitter: {
    card: 'summary',
    title: 'PromptDock - AI 提示词工作台',
    description:
      '免费在线 AI 提示词工作台，支持模板导入、变量可视化填写、一键跳转到主流 AI 平台。',
    creator: '@cyberteng'
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'PromptDock',
    description:
      '免费在线 AI 提示词工作台，支持模板导入、变量可视化填写、一键跳转到 ChatGPT、Claude、DeepSeek 等主流 AI 平台。',
    url: BASE_URL,
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY'
    },
    author: {
      '@type': 'Person',
      name: 'cyberteng',
      url: 'https://github.com/nbzz/PromptDock'
    }
  };

  return (
    <html lang="zh-CN">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
