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
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-mono',
  display: 'swap',
})

// ── METADATA ────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: 'NEXGEAR — Next-Gen Gear Store',
    template: '%s | NEXGEAR',
  },
  description:
    'Bàn phím cơ, chuột gaming, tai nghe, loa, mic và phụ kiện máy tính cao cấp. Giao hàng toàn quốc.',
  keywords: ['bàn phím cơ', 'chuột gaming', 'tai nghe', 'gear máy tính', 'nexgear'],
  authors: [{ name: 'NEXGEAR' }],
  creator: 'NEXGEAR',
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: 'https://nexgear.vn',
    siteName: 'NEXGEAR',
    title: 'NEXGEAR — Next-Gen Gear Store',
    description: 'Bàn phím cơ, chuột gaming, tai nghe và phụ kiện cao cấp.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'NEXGEAR' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NEXGEAR — Next-Gen Gear Store',
    description: 'Gear máy tính cao cấp',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
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
          <ToastProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}