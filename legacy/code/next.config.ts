import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  /* Performance optimizations */
  
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Ship source maps in production to debug minified errors
  productionBrowserSourceMaps: true,

  // Enable compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Optimize CSS - Disabled due to critters dependency issue in turbopack
  // experimental: {
  //   optimizeCss: true,
  // },
  experimental: {
    externalDir: true,
  },
  outputFileTracingRoot: path.join(__dirname, '.'),
  transpilePackages: ['rhythm-core'],
}

export default nextConfig
