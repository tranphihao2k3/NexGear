// ============================================================
// NEXGEAR — Root Layout
// File: app/layout.tsx
// ============================================================
import type { Metadata, Viewport } from 'next'
import { Orbitron, DM_Sans, JetBrains_Mono } from 'next/font/google'
import { ToastProvider } from '@/components/ui'
import '@/styles/globals.scss'

// ── FONTS ───────────────────────────────────────────────────
const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '600'],
  variable: '--font-mono',
  display: 'swap',
})

// ── METADATA ────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL('https://nexgear.vn'),
  verification: {
    google: 'bWsGu1qOKzmhUPHyZ21TF5CkMouJhBA9AO33OgLrW2I',
  },
  title: {
    default: 'NexGear — Gear Máy Tính Chính Hãng Cần Thơ',
    template: '%s | NexGear',
  },
  description:
    'NexGear — shop gear máy tính chính hãng #1 Cần Thơ. Bàn phím cơ, chuột gaming, tai nghe, loa, micro và phụ kiện. Giao nhanh 2H, bảo hành 12T.',
  keywords: [
    'gear máy tính Cần Thơ',
    'bàn phím cơ Cần Thơ',
    'chuột gaming Cần Thơ',
    'tai nghe gaming Cần Thơ',
    'phụ kiện PC Cần Thơ',
    'nexgear',
    'shop gear Cần Thơ',
  ],
  authors: [{ name: 'NexGear' }],
  creator: 'NexGear',
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: 'https://nexgear.vn',
    siteName: 'NexGear',
    title: 'NexGear — Gear Máy Tính Chính Hãng Cần Thơ',
    description: 'Shop gear máy tính chính hãng #1 Cần Thơ. Giao nhanh 2H, bảo hành 12T.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'NexGear Cần Thơ' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NexGear — Gear Máy Tính Chính Hãng Cần Thơ',
    description: 'Shop gear máy tính chính hãng #1 Cần Thơ',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F4F2ED',
}

// ── LAYOUT ──────────────────────────────────────────────────
import LayoutWrapper from '@/components/layout/LayoutWrapper'
import { AuthProvider } from '@/components/layout/AuthProvider'
import { QueryProvider } from '@/components/layout/QueryProvider'
import dbConnect from '@/lib/mongodb'
import Setting from '@/models/Setting'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let settings = null;
  try {
    await dbConnect();
    settings = await Setting.findOne().lean();
  } catch (err) {
    console.error('Failed to load settings in layout:', err);
  }

  const primaryColor = settings?.primaryColor || '#00C4AD';
  const accentColor = settings?.accentColor || '#F0356A';

  return (
    <html
      lang="vi"
      className={`${orbitron.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
      style={{
        '--color-primary': primaryColor,
        '--color-accent': accentColor,
      } as React.CSSProperties}
    >
      <body>
        <AuthProvider>
          <QueryProvider>
            <ToastProvider>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
            </ToastProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  )
}