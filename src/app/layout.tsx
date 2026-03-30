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
  let settings = null;
  try {
    await dbConnect();
    const siteId = process.env.NEXT_PUBLIC_SITE_ID || 'nexgear';
    settings = await Setting.findOne({ siteId }).lean();
    
    // Auto-migration fallback read for existing database
    if (!settings && siteId === 'nexgear') {
      settings = await Setting.findOne({ siteId: { $exists: false } }).lean();
    }
  } catch (err) {
    console.error('Failed to load settings in layout:', err);
  }

  const primaryColor = settings?.primaryColor || '#00C4AD';
  const accentColor = settings?.accentColor || '#F0356A';

  const siteSettings = await getSiteSettings();

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
