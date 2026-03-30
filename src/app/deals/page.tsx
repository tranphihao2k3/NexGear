// ============================================================
// NEXGEAR — Flash Deal (Server Component)
// File: app/deals/page.tsx
// SEO: generateMetadata static, JSON-LD BreadcrumbList
// ============================================================
import type { Metadata } from 'next'
import { getSiteSettings } from '@/lib/site-config'
import DealsClient from './DealsClient'

// ── GENERATE METADATA ───────────────────────────────────────
export async function generateMetadata(): Promise<Metadata> {
    const s = await getSiteSettings()
    return {
        title: `Flash Deal — Giảm Đến 50% Gear Gaming — ${s.storeName}`,
        description: `Flash Sale mỗi ngày tại ${s.storeName} Cần Thơ! Giảm đến 50% bàn phím, chuột, tai nghe, phụ kiện. Số lượng có hạn — nhanh tay!`,
        keywords: [
            'flash sale gear Cần Thơ',
            'khuyến mãi gaming gear',
            'deal chuột gaming',
            'giảm giá bàn phím cơ',
            'flash deal tai nghe',
            'khuyến mãi phụ kiện PC Cần Thơ'
        ],
        openGraph: {
            title: `Flash Deal — Giảm Đến 50% Gear Gaming — ${s.storeName}`,
            description: `Flash Sale mỗi ngày tại ${s.storeName} Cần Thơ! Giảm đến 50% bàn phím, chuột, tai nghe, phụ kiện. Số lượng có hạn — nhanh tay!`,
            url: `${s.siteDomain}/deals`,
            siteName: s.storeName,
            locale: 'vi_VN',
            type: 'website',
            images: [{ url: s.ogImage, width: 1200, height: 630 }],
        },
        twitter: {
            card: 'summary_large_image',
            title: `Flash Deal — Giảm Đến 50% Gear Gaming — ${s.storeName}`,
            description: `Flash Sale mỗi ngày tại ${s.storeName} Cần Thơ! Giảm đến 50% bàn phím, chuột, tai nghe, phụ kiện.`,
        },
        alternates: {
            canonical: `${s.siteDomain}/deals`,
        },
    }
}

// ── PAGE COMPONENT (Server) ─────────────────────────────────
export default async function DealsPage() {
    const s = await getSiteSettings()

    // JSON-LD BreadcrumbList
    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: `${s.siteDomain}/` },
            { '@type': 'ListItem', position: 2, name: 'Flash Deal', item: `${s.siteDomain}/deals` },
        ],
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            <DealsClient />
        </>
    )
}
