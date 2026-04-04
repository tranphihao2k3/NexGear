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
import { getSiteSettings } from '@/lib/site-config'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings()
  const keywords = s.siteKeywords.split(',').map(k => k.trim()).filter(Boolean)
  return {
    metadataBase: new URL(s.siteDomain),
    manifest: '/manifest.webmanifest',
    verification: {
      google: 'bWsGu1qOKzmhUPHyZ21TF5CkMouJhBA9AO33OgLrW2I',
    },
    title: {
      default: s.siteTitle,
      template: s.siteTitleTemplate,
    },
    description: s.siteDescription,
    keywords,
    authors: [{ name: s.storeName }],
    creator: s.storeName,
    openGraph: {
      type: 'website',
      locale: 'vi_VN',
      url: s.siteDomain,
      siteName: s.storeName,
      title: s.siteTitle,
      description: s.siteDescription,
      images: [{ url: s.ogImage, width: 1200, height: 630, alt: s.storeName }],
    },
    twitter: {
      card: 'summary_large_image',
      title: s.siteTitle,
      description: s.siteDescription,
      images: [s.ogImage],
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
    icons: s.faviconUrl
      ? {
          icon: [
            { url: s.faviconUrl, type: 'image/x-icon' },
            { url: s.faviconUrl, sizes: '32x32' },
            { url: s.faviconUrl, sizes: '192x192' },
          ],
          apple: [{ url: s.faviconUrl }],
          shortcut: s.faviconUrl,
        }
      : {
          icon: '/favicon.ico',
          shortcut: '/favicon.ico',
        },
  }
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
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext'
import dbConnect from '@/lib/mongodb'
import Setting from '@/models/Setting'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { headers } = await import('next/headers');
  const headersList = await headers();
  const host = headersList.get('host') || '';

  // Tất cả settings đều lấy theo host (multi-tenant)
  const siteSettings = await getSiteSettings(host);

  // Lấy màu thương hiệu — cùng identifier với getSiteSettings
  let primaryColor = '#00C4AD';
  let accentColor = '#F0356A';
  try {
    await dbConnect();
    const rawIdentifier = host.startsWith('localhost') || host === ''
      ? (process.env.NEXT_PUBLIC_SITE_ID || 'nexgear')
      : host;
    let rawSettings = await Setting.findOne({ siteId: rawIdentifier }).lean() as any;
    if (!rawSettings) {
      rawSettings = await Setting.findOne({
        siteDomain: { $regex: rawIdentifier.split(':')[0], $options: 'i' }
      }).lean() as any;
    }
    if (rawSettings?.primaryColor) primaryColor = rawSettings.primaryColor;
    if (rawSettings?.accentColor) accentColor = rawSettings.accentColor;
  } catch (err) {
    console.error('Failed to load brand colors in layout:', err);
  }

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
            <SiteSettingsProvider settings={siteSettings}>
              <ToastProvider>
                <LayoutWrapper>
                  {children}
                </LayoutWrapper>
              </ToastProvider>
            </SiteSettingsProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
