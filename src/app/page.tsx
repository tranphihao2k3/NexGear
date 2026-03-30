// ============================================================
// NEXGEAR — Trang chủ (Server Component)
// File: app/page.tsx
import HomeClient from './HomeClient'
import StorefrontClient from './StorefrontClient'
import { getSiteSettings } from '@/lib/site-config'

export const dynamic = 'force-dynamic';

// ── PAGE ─────────────────────────────────────────────────────
export default async function HomePage() {
  const s = await getSiteSettings()

  // ── JSON-LD SCHEMAS ─────────────────────────────────────────
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'ComputerStore',
    '@id': `${s.siteDomain}/#organization`,
    name: s.storeName,
    alternateName: `${s.storeName} Cần Thơ`,
    description:
      'Cửa hàng thiết bị ngoại vi và phụ kiện PC chính hãng tại Cần Thơ. Bàn phím cơ, chuột gaming, tai nghe, loa, micro và phụ kiện.',
    url: `${s.siteDomain}/`,
    logo: {
      '@type': 'ImageObject',
      url: s.logoUrl,
      width: 512,
      height: 512,
    },
    image: s.ogImage.startsWith('http') ? s.ogImage : `${s.siteDomain}${s.ogImage}`,
    telephone: s.storePhone,
    email: s.storeEmail,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Ninh Kiều',
      addressLocality: 'Cần Thơ',
      addressRegion: 'Cần Thơ',
      postalCode: '900000',
      addressCountry: 'VN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '10.0452',
      longitude: '105.7469',
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
    sameAs: [
      `${s.siteDomain}/`,
      s.siteDomain,
      ...(s.facebook ? [s.facebook] : []),
      ...(s.instagram ? [s.instagram] : []),
      ...(s.tiktok ? [s.tiktok] : []),
    ].filter(Boolean),
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${s.siteDomain}/#website`,
    name: s.storeName,
    url: `${s.siteDomain}/`,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${s.siteDomain}/search?q={search_term_string}`,
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
      {s.showLandingPage === false ? <StorefrontClient /> : <HomeClient />}
    </>
  )
}
