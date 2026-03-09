// ============================================================
// NEXGEAR — Trang chủ (Server Component)
// File: app/page.tsx
// SEO: LocalBusiness + WebSite schema, metadata từ root layout
// ============================================================
import HomeClient from './HomeClient'

// ── JSON-LD SCHEMAS ─────────────────────────────────────────
const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'ComputerStore',
  '@id': 'https://nexgear.vn/#organization',
  name: 'NexGear',
  alternateName: 'NexGear Cần Thơ',
  description:
    'Cửa hàng thiết bị ngoại vi và phụ kiện PC chính hãng tại Cần Thơ. Bàn phím cơ, chuột gaming, tai nghe, loa, micro và phụ kiện.',
  url: 'https://nexgear.vn',
  logo: {
    '@type': 'ImageObject',
    url: 'https://nexgear.vn/logo.png',
    width: 512,
    height: 512,
  },
  image: 'https://nexgear.vn/og-image.jpg',
  // TODO: Điền SĐT, địa chỉ cụ thể
  telephone: '',
  email: '',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '',
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
  sameAs: [],
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://nexgear.vn/#website',
  name: 'NexGear',
  url: 'https://nexgear.vn',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://nexgear.vn/search?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
}

// ── PAGE ─────────────────────────────────────────────────────
export default function HomePage() {
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
