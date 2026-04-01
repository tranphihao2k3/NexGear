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

  // Images from external cPanel image server
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