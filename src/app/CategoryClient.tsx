// ============================================================
// NEXGEAR — Trang chủ (Server Component)
// File: app/page.tsx
// SEO: LocalBusiness + WebSite schema, metadata từ root layout
// ============================================================
import HomeClient from './HomeClient'
import { getSiteSettings } from '@/lib/site-config'

// ── PAGE ─────────────────────────────────────────────────────
export default async function HomePage() {
  const settings = await getSiteSettings()

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'ComputerStore',
    '@id': `${settings.siteDomain}/#organization`,
    name: settings.storeName,
    alternateName: `${settings.storeName} Cần Thơ`,
    description: settings.siteDescription,
    url: `${settings.siteDomain}/`,
    logo: {
      '@type': 'ImageObject',
      url: `${settings.siteDomain}/logo.png`,
      width: 512,
      height: 512,
    },
    image: `${settings.siteDomain}${settings.ogImage}`,
    telephone: settings.storePhone,
    email: settings.storeEmail,
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.storeAddress,
      addressLocality: 'Cần Thơ',
      addressRegion: 'Cần Thơ',
      postalCode: '900000',
      addressCountry: 'VN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '',
      longitude: '',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '08:00',
        closes: '21:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Sunday',
        opens: '09:00',
        closes: '18:00',
      },
    ],
    priceRange: '₫₫',
    currenciesAccepted: 'VND',
    paymentAccepted: 'Cash, Credit Card, Bank Transfer, Momo, ZaloPay',
    areaServed: [
      { '@type': 'City', name: 'Cần Thơ' },
      { '@type': 'State', name: 'Đồng bằng sông Cửu Long' },
    ],
    sameAs: [settings.facebook, settings.instagram, settings.tiktok].filter(Boolean),
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${settings.siteDomain}/#website`,
    name: settings.storeName,
    url: `${settings.siteDomain}/`,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${settings.siteDomain}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <HomeClient />
    </>
  )
}
