// ============================================================
// NEXGEAR — Next.js Config
// File: next.config.ts
// ============================================================
import type { NextConfig } from 'next'
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'

const nextConfig: NextConfig = {
  // ⚠️ Quan trọng cho Cloudflare Workers:
  // Loại trừ các package nặng khỏi bundle server để tránh vượt
  // giới hạn 3 MiB (Free plan) / 10 MiB (Paid plan) của Worker.
  serverExternalPackages: [
    'mongoose',
    'mongodb',
    '@google/genai',
    'openai',
    'bcryptjs',
    'pusher',
    'next-auth',
    '@auth/core',
    'jose',
    // Thêm các package nặng khác:
    'xlsx',                 // Excel parsing - nặng
    '@tiptap/pm',           // ProseMirror - nặng
    '@tiptap/starter-kit',
    '@react-three/fiber',   // Three.js - rất nặng
    '@react-three/drei',
    'three',
    'framer-motion',
    'gsap',
    'html2canvas-pro',
    'yet-another-react-lightbox',
    'swiper',
    '@tanstack/react-query',
    'react-hook-form',
    'zod',
    'jsonwebtoken',
  ],

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

// Khởi tạo Cloudflare bindings cho local dev (KV, R2, D1, etc.)
initOpenNextCloudflareForDev()