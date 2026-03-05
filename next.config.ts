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
        hostname:  'res.cloudinary.com',
        pathname:  '/**',
      },
    ],
  },

  // Giữ console.log trong dev, xóa trong production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },
}

export default nextConfig