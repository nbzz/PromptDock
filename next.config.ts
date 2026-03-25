import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typedRoutes: true,
  turbopack: {
    root: process.cwd()
  },
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
