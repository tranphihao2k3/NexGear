// ============================================================
// NEXGEAR — Trang Danh Mục (Server Component)
// File: app/[category]/page.tsx
// SEO: generateMetadata, BreadcrumbList schema
// ============================================================
import type { Metadata } from 'next'
import CategoryClient from './CategoryClient'

// ── SEO META MAP ────────────────────────────────────────────
const CATEGORY_SEO: Record<string, {
    title: string
    description: string
    h1: string
    keywords: string[]
}> = {
    'ban-phim': {
        title: 'Bàn Phím Cơ Gaming Chính Hãng — NexGear Cần Thơ',
        description: 'Mua bàn phím cơ gaming chính hãng tại Cần Thơ. Akko, Keychron, Razer — giá tốt, bảo hành 12T, giao nhanh 2H. Xem ngay!',
        h1: 'Bàn Phím Cơ Gaming',
        keywords: ['bàn phím cơ Cần Thơ', 'bàn phím gaming', 'bàn phím không dây', 'mua bàn phím Cần Thơ'],
    },
    'chuot': {
        title: 'Chuột Gaming & Wireless Chính Hãng — NexGear Cần Thơ',
        description: 'Chuột gaming, chuột không dây chính hãng Logitech, Razer, Pulsar tại Cần Thơ. Giá tốt nhất, đổi trả 7 ngày. Đặt hàng ngay!',
        h1: 'Chuột Gaming & Wireless',
        keywords: ['chuột gaming Cần Thơ', 'chuột không dây', 'chuột Logitech', 'mua chuột Cần Thơ'],
    },
    'tai-nghe': {
        title: 'Tai Nghe Gaming & Hi-Fi Chính Hãng — NexGear Cần Thơ',
        description: 'Tai nghe gaming, Hi-Fi, TWS chính hãng tại Cần Thơ. HyperX, Sony, Sennheiser — bảo hành 12T, giao nhanh. Mua ngay!',
        h1: 'Tai Nghe Gaming & Hi-Fi',
        keywords: ['tai nghe gaming Cần Thơ', 'tai nghe bluetooth', 'headphone Hi-Fi', 'mua tai nghe Cần Thơ'],
    },
    'loa-mic': {
        title: 'Loa & Micro Stream Chính Hãng — NexGear Cần Thơ',
        description: 'Mua loa bluetooth, micro stream, mic podcast chính hãng tại Cần Thơ. Edifier, HyperX, Razer — ship nhanh, giá tốt!',
        h1: 'Loa & Micro Stream',
        keywords: ['loa bluetooth Cần Thơ', 'micro stream', 'mic podcast', 'mua loa Cần Thơ'],
    },
    'phu-kien': {
        title: 'Phụ Kiện Gaming & Keycap — NexGear Cần Thơ',
        description: 'Keycap, lót chuột, switch, cable custom và phụ kiện gaming chính hãng tại Cần Thơ. Giá tốt, giao nhanh. Xem ngay!',
        h1: 'Phụ Kiện Gaming & Keycap',
        keywords: ['phụ kiện bàn phím Cần Thơ', 'keycap PBT', 'lót chuột gaming', 'switch Cherry'],
    },
}

// ── GENERATE METADATA ───────────────────────────────────────
export async function generateMetadata({
    params,
}: {
    params: Promise<{ category: string }>
}): Promise<Metadata> {
    const { category } = await params
    const seo = CATEGORY_SEO[category]

    if (!seo) {
        return {
            title: 'Danh mục sản phẩm — NexGear Cần Thơ',
            description: 'Khám phá danh mục sản phẩm gaming gear chính hãng tại NexGear Cần Thơ.',
        }
    }

    return {
        title: seo.title,
        description: seo.description,
        keywords: seo.keywords,
        openGraph: {
            title: seo.title,
            description: seo.description,
            url: `https://nexgear.vn/${category}`,
            siteName: 'NexGear',
            locale: 'vi_VN',
            type: 'website',
            images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
        },
        twitter: {
            card: 'summary_large_image',
            title: seo.title,
            description: seo.description,
        },
        alternates: {
            canonical: `https://nexgear.vn/${category}`,
        },
    }
}

// ── PAGE COMPONENT (Server) ─────────────────────────────────
export default async function CategoryPage({
    params,
}: {
    params: Promise<{ category: string }>
}) {
    const { category } = await params
    const seo = CATEGORY_SEO[category] || CATEGORY_SEO['ban-phim']

    // JSON-LD BreadcrumbList
    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: 'https://nexgear.vn' },
            { '@type': 'ListItem', position: 2, name: seo.h1, item: `https://nexgear.vn/${category}` },
        ],
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            <CategoryClient categorySlug={category} h1={seo.h1} />
        </>
    )
}
