import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PromptDock',
    short_name: 'PromptDock',
    description: '导入模板，自动填变量，一键复制并打开 AI 平台',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#0ea5a5',
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml'
      }
    ]
  };
}
