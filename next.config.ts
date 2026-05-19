// ============================================================
// NEXGEAR — Next.js Config
// File: next.config.ts
// ============================================================
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Fix lỗi Vercel build: ENOENT middleware.js.nft.json
  // Known issue với Next.js 16 + Vercel middleware file tracing
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@swc/core-linux-x64-gnu',
        'node_modules/@swc/core-linux-x64-musl',
        'node_modules/@esbuild/linux-x64',
      ],
    },
  },

  // Bật SCSS modules
  sassOptions: {
    // Tự động inject @use vào mọi module.scss
    // Không cần @use '@/styles/tokens' thủ công
    additionalData: `
      @use '@/styles/tokens' as *;
      @use '@/styles/mixins' as *;
    `,
  },

  // Images from external CDN / cPanel / any domain for logos
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'hard-mauve-chihuahua.202-92-4-12.cpanel.site',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**', // Cho phép mọi HTTPS domain (logo, CDN)
      },
      {
        protocol: 'http',
        hostname: '**', // Cho phép mọi HTTP domain (dev / local CDN)
      },
    ],
  },

  // Giữ console.log trong dev, xóa trong production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },

  // CORS headers for API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
        ],
      },
    ]
  },

}


export default nextConfig