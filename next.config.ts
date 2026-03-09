// ============================================================
// NEXGEAR — Next.js Config
// File: next.config.ts
// ============================================================
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Bật SCSS modules
  sassOptions: {
    // Tự động inject @use vào mọi module.scss
    // Không cần @use '@/styles/tokens' thủ công
    additionalData: `
      @use '@/styles/tokens' as *;
      @use '@/styles/mixins' as *;
    `,
  },

  // Image domains (Cloudinary)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },

  // Giữ console.log trong dev, xóa trong production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },

  // CORS Headers — hỗ trợ multi-origin (localhost + production)
  async headers() {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://laplapcantho.store',
      'https://www.laplapcantho.store',
      ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
    ]

    return [
      {
        source: '/api/:path*',
        headers: [
          // Dùng wildcard '*' cho GET public endpoints (không credentials)
          // Credentials=true được handle qua middleware riêng nếu cần
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-api-key' },
        ],
      },
    ]
  },
}

export default nextConfig