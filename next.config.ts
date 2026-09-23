import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typedRoutes: true,
  // 关闭开发指示器浮层：它固定在左下角，会盖住移动端吸底操作条的「仅复制」按钮
  // 并拦截点击（pointer events）。仅影响 `next dev`，生产构建不受影响。
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.google.com'
      }
    ]
  }
};

export default nextConfig;
