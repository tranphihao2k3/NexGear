// ============================================================
// NEXGEAR — Trang chủ (Server Component)
// File: app/page.tsx
import HomeClient from './HomeClient'
import StorefrontClient from './StorefrontClient'
import { getSiteSettings } from '@/lib/site-config'
import dbConnect from '@/lib/mongodb'
import Category from '@/models/Category'
import Product from '@/models/Product'
import Blog from '@/models/Blog'

// ISR: revalidate every 60s instead of force-dynamic
export const revalidate = 60;

// Fetch all storefront data server-side in one go
async function getStorefrontData() {
  await dbConnect();

  // Fetch categories
  const allCategories = await Category.find({ isActive: true })
    .sort({ order: 1, name: 1 })
    .lean();

  // Build tree
  const childrenMap = new Map<string, any[]>();
  const roots: any[] = [];
  for (const cat of allCategories) {
    if (cat.parent) {
      const pid = cat.parent.toString();
      if (!childrenMap.has(pid)) childrenMap.set(pid, []);
      childrenMap.get(pid)!.push(cat);
    } else {
      roots.push(cat);
    }
  }

  // Priority sort
  const laptopSlugs = ['gaming-laptop', 'ultrabook', 'workstation', 'laptop-sinh-vien'];
  roots.sort((a, b) => {
    const aIdx = laptopSlugs.indexOf(a.slug);
    const bIdx = laptopSlugs.indexOf(b.slug);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    if (a.slug === 'laptop') return -1;
    if (b.slug === 'laptop') return 1;
    return 0;
  });

  // Build category groups with IDs for product query
  const categoryGroups = roots.map((root) => {
    const rootId = root._id.toString();
    const children = childrenMap.get(rootId) || [];
    return {
      category: {
        _id: rootId,
        name: root.name,
        slug: root.slug,
        children: children.map((c: any) => ({
          _id: c._id.toString(),
          name: c.name,
          slug: c.slug,
        })),
      },
      categoryIds: [root._id, ...children.map((c: any) => c._id)],
    };
  });

  // Single $facet aggregation for all category products
  const facetStages: Record<string, any[]> = {};
  for (const group of categoryGroups) {
    facetStages[group.category.slug] = [
      { $match: { category: { $in: group.categoryIds }, isActive: { $ne: false } } },
      { $addFields: { _inStock: { $cond: [{ $gt: ['$stock', 0] }, 1, 0] } } },
      { $sort: { _inStock: -1, createdAt: -1 } },
      { $limit: 8 },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          pipeline: [{ $project: { name: 1, slug: 1, logo: 1 } }],
          as: '_brand',
        },
      },
      { $addFields: { brand: { $arrayElemAt: ['$_brand', 0] } } },
      { $project: { _brand: 0, _inStock: 0, costPrice: 0 } },
    ];
  }

  const [facetResult] = categoryGroups.length > 0
    ? await Product.aggregate([{ $facet: facetStages }])
    : [{}];

  const sections = categoryGroups.map((group) => ({
    category: group.category,
    products: JSON.parse(JSON.stringify(facetResult[group.category.slug] || [])),
  }));

  // Navbar categories (tree format)
  const navCategories = roots.map((root) => {
    const rootId = root._id.toString();
    const children = childrenMap.get(rootId) || [];
    return {
      _id: rootId,
      name: root.name,
      slug: root.slug,
      children: children.map((c: any) => ({
        _id: c._id.toString(),
        name: c.name,
        slug: c.slug,
        description: c.description || '',
      })),
    };
  });

  return { sections: JSON.parse(JSON.stringify(sections)), navCategories: JSON.parse(JSON.stringify(navCategories)) };
}

async function getHomeData() {
  await dbConnect();

  const [featuredProducts, blogs] = await Promise.all([
    Product.find({ isFeatured: true, isActive: { $ne: false } })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('brand', 'name slug logo')
      .populate('category', 'name slug')
      .lean(),
    Blog.find({})
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(3)
      .lean(),
  ]);

  return {
    featuredProducts: JSON.parse(JSON.stringify(featuredProducts)),
    blogs: JSON.parse(JSON.stringify(blogs)),
  };
}

// ── PAGE ─────────────────────────────────────────────────────
export default async function HomePage() {
  const s = await getSiteSettings()

  // Fetch data server-side based on which client to show
  const isStorefront = s.showLandingPage === false;

  const [storefrontData, homeData] = await Promise.all([
    isStorefront ? getStorefrontData() : Promise.resolve(null),
    !isStorefront ? getHomeData() : Promise.resolve(null),
  ]);

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
      {isStorefront ? (
        <StorefrontClient
          initialSections={storefrontData!.sections}
        />
      ) : (
        <HomeClient
          initialProducts={homeData!.featuredProducts}
          initialBlogs={homeData!.blogs}
        />
      )}
    </>
  )
}
