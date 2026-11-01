import type { NextConfig } from 'next';

const nextConfiguration: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    optimizePackageImports: ['@phosphor-icons/react'],
  },
  async rewrites() {
    const apiOrigin = process.env.UELEY_API_ORIGIN ?? 'http://localhost:3001';
    return [{ source: '/api/v1/:path*', destination: `${apiOrigin}/api/v1/:path*` }];
  },
};

export default nextConfiguration;
