/* eslint-disable no-restricted-syntax */
import type { NextConfig } from 'next'
import path from 'path'

const engineBaseUrl = process.env.ENGINE_BASE_URL

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  productionBrowserSourceMaps: true,
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },
  experimental: {
    externalDir: true,
  },
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['rhythm-core', '@rhythm/ui'],
  async rewrites() {
    if (!engineBaseUrl) {
      return []
    }
    return [
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
      },
      {
        source: '/api/admin/funnels/:path*',
        destination: '/api/admin/funnels/:path*',
      },
      {
        source: '/api/admin/funnels',
        destination: '/api/admin/funnels',
      },
      {
        source: '/api/:path*',
        destination: `${engineBaseUrl}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
