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
    'laptop': {
        title: 'Laptop Gaming & Văn Phòng Chính Hãng — NexGear Cần Thơ',
        description: 'Mua laptop gaming, laptop văn phòng chính hãng tại Cần Thơ. ASUS, Dell, HP, MacBook — giá tốt, trả góp 0%, bảo hành 12T. Xem ngay!',
        h1: 'Laptop Gaming & Văn Phòng',
        keywords: ['laptop gaming Cần Thơ', 'laptop văn phòng', 'mua laptop Cần Thơ', 'MacBook Cần Thơ'],
    },
    // ── LAPTOP SUB-CATEGORIES ──
    'gaming-laptop': {
        title: 'Laptop Gaming Chính Hãng — NexGear Cần Thơ',
        description: 'Laptop gaming hiệu năng cao ASUS ROG, MSI, Lenovo Legion tại Cần Thơ. RTX 50/40 Series, trả góp 0%, bảo hành 12T.',
        h1: 'Laptop Gaming',
        keywords: ['laptop gaming Cần Thơ', 'laptop gaming RTX', 'ASUS ROG Cần Thơ', 'MSI gaming'],
    },
    'ultrabook': {
        title: 'Ultrabook Mỏng Nhẹ Chính Hãng — NexGear Cần Thơ',
        description: 'Ultrabook mỏng nhẹ, thời trang. MacBook, Dell XPS, ASUS ZenBook tại Cần Thơ. Giá tốt, giao nhanh 2H.',
        h1: 'Ultrabook',
        keywords: ['ultrabook Cần Thơ', 'laptop mỏng nhẹ', 'MacBook Cần Thơ', 'Dell XPS'],
    },
    'workstation': {
        title: 'Laptop Workstation Đồ Họa — NexGear Cần Thơ',
        description: 'Laptop workstation cho đồ họa, lập trình, render 3D. ThinkPad, HP ZBook, Dell Precision tại Cần Thơ.',
        h1: 'Laptop Workstation',
        keywords: ['laptop workstation Cần Thơ', 'laptop đồ họa', 'laptop lập trình', 'ThinkPad'],
    },
    'laptop-sinh-vien': {
        title: 'Laptop Sinh Viên Giá Tốt — NexGear Cần Thơ',
        description: 'Laptop sinh viên giá rẻ, phù hợp học tập và làm việc. Trả góp 0%, bảo hành 12T tại Cần Thơ.',
        h1: 'Laptop Sinh Viên',
        keywords: ['laptop sinh viên Cần Thơ', 'laptop giá rẻ', 'laptop học tập', 'laptop trả góp'],
    },
    // ── CHUỘT SUB-CATEGORIES ──
    'chuot-gaming': {
        title: 'Chuột Gaming Chính Hãng — NexGear Cần Thơ',
        description: 'Chuột gaming chuyên nghiệp Logitech, Razer, Pulsar tại Cần Thơ. Sensor 26K DPI, đổi trả 7 ngày.',
        h1: 'Chuột Gaming',
        keywords: ['chuột gaming Cần Thơ', 'chuột Razer', 'chuột Logitech', 'chuột chơi game'],
    },
    'chuot-wireless': {
        title: 'Chuột Wireless Không Dây — NexGear Cần Thơ',
        description: 'Chuột không dây chính hãng Logitech, Razer tại Cần Thơ. Kết nối Bluetooth & 2.4GHz, giá tốt.',
        h1: 'Chuột Wireless',
        keywords: ['chuột không dây Cần Thơ', 'chuột wireless', 'chuột bluetooth', 'chuột Logitech wireless'],
    },
    'chuot-ergonomic': {
        title: 'Chuột Ergonomic Công Thái Học — NexGear Cần Thơ',
        description: 'Chuột ergonomic thiết kế công thái học, chống mỏi tay. Logitech MX, Razer Pro tại Cần Thơ.',
        h1: 'Chuột Ergonomic',
        keywords: ['chuột ergonomic Cần Thơ', 'chuột công thái học', 'Logitech MX', 'chuột văn phòng'],
    },
    'chuot-sieu-nhe': {
        title: 'Chuột Siêu Nhẹ Dưới 60g — NexGear Cần Thơ',
        description: 'Chuột siêu nhẹ dưới 60g cho game FPS. Pulsar, Finalmouse, Lamzu tại Cần Thơ.',
        h1: 'Chuột Siêu Nhẹ',
        keywords: ['chuột siêu nhẹ Cần Thơ', 'chuột nhẹ gaming', 'Pulsar', 'Finalmouse'],
    },
    // ── BÀN PHÍM SUB-CATEGORIES ──
    'ban-phim-co': {
        title: 'Bàn Phím Cơ Chính Hãng — NexGear Cần Thơ',
        description: 'Bàn phím cơ mechanical cao cấp Akko, Keychron, Razer tại Cần Thơ. Cherry MX, Gateron, giá tốt.',
        h1: 'Bàn Phím Cơ',
        keywords: ['bàn phím cơ Cần Thơ', 'mechanical keyboard', 'bàn phím Akko', 'Cherry MX'],
    },
    'ban-phim-khong-day': {
        title: 'Bàn Phím Không Dây — NexGear Cần Thơ',
        description: 'Bàn phím không dây Bluetooth, 2.4GHz chính hãng. Keychron, Logitech tại Cần Thơ.',
        h1: 'Bàn Phím Không Dây',
        keywords: ['bàn phím không dây Cần Thơ', 'bàn phím bluetooth', 'Keychron wireless'],
    },
    'ban-phim-tkl': {
        title: 'Bàn Phím TKL / 75% Compact — NexGear Cần Thơ',
        description: 'Bàn phím TKL, 75% compact tiết kiệm không gian. Akko, Keychron, Monsgeek tại Cần Thơ.',
        h1: 'Bàn Phím TKL / 75%',
        keywords: ['bàn phím TKL Cần Thơ', 'bàn phím 75%', 'bàn phím compact'],
    },
    'ban-phim-60': {
        title: 'Bàn Phím 60% / 65% Ultra Compact — NexGear Cần Thơ',
        description: 'Bàn phím 60%, 65% ultra compact tối giản. Tofu, Zoom65, KBD67 tại Cần Thơ.',
        h1: 'Bàn Phím 60% / 65%',
        keywords: ['bàn phím 60% Cần Thơ', 'bàn phím 65%', 'bàn phím mini'],
    },
    'custom-kit': {
        title: 'Custom Keyboard Kit & Barebone — NexGear Cần Thơ',
        description: 'Kit barebone custom keyboard, DIY kit gasket mount. QK65, Zoom75, Monsgeek tại Cần Thơ.',
        h1: 'Custom Kit',
        keywords: ['custom keyboard Cần Thơ', 'barebone kit', 'DIY keyboard', 'gasket mount'],
    },
    // ── TAI NGHE SUB-CATEGORIES ──
    'tai-nghe-over-ear': {
        title: 'Tai Nghe Over-ear Chính Hãng — NexGear Cần Thơ',
        description: 'Tai nghe over-ear trùm tai, bass sâu. Sony, Sennheiser, HyperX tại Cần Thơ. Bảo hành 12T.',
        h1: 'Tai Nghe Over-ear',
        keywords: ['tai nghe over-ear Cần Thơ', 'headphone', 'tai nghe Sony', 'Sennheiser'],
    },
    'tai-nghe-in-ear': {
        title: 'Tai Nghe In-ear & TWS — NexGear Cần Thơ',
        description: 'Tai nghe in-ear, true wireless stereo chính hãng. Sony, Samsung, Moondrop tại Cần Thơ.',
        h1: 'Tai Nghe In-ear / TWS',
        keywords: ['tai nghe in-ear Cần Thơ', 'TWS', 'tai nghe true wireless', 'earbuds'],
    },
    'tai-nghe-gaming': {
        title: 'Tai Nghe Gaming 7.1 — NexGear Cần Thơ',
        description: 'Tai nghe gaming âm thanh vòm 7.1. HyperX, Razer, SteelSeries tại Cần Thơ. Giá tốt, bảo hành 12T.',
        h1: 'Tai Nghe Gaming',
        keywords: ['tai nghe gaming Cần Thơ', 'headset gaming', 'HyperX', 'tai nghe 7.1'],
    },
    // ── LOA SUB-CATEGORIES ──
    'soundbar': {
        title: 'Soundbar Cho Bàn Setup — NexGear Cần Thơ',
        description: 'Soundbar, loa thanh cho bàn setup gaming & văn phòng. Edifier, Creative tại Cần Thơ.',
        h1: 'Soundbar',
        keywords: ['soundbar Cần Thơ', 'loa thanh', 'soundbar gaming', 'Edifier soundbar'],
    },
    'loa-bluetooth': {
        title: 'Loa Bluetooth Di Động — NexGear Cần Thơ',
        description: 'Loa bluetooth di động, pin lâu. JBL, Marshall, Sony tại Cần Thơ. Giá tốt, giao nhanh.',
        h1: 'Loa Bluetooth',
        keywords: ['loa bluetooth Cần Thơ', 'loa di động', 'loa JBL', 'loa Marshall'],
    },
    'loa-desktop': {
        title: 'Loa Desktop 2.0 / 2.1 — NexGear Cần Thơ',
        description: 'Loa desktop 2.0, 2.1 cho PC gaming & văn phòng. Edifier, Creative, Harman tại Cần Thơ.',
        h1: 'Loa Desktop',
        keywords: ['loa desktop Cần Thơ', 'loa PC', 'loa 2.1', 'Edifier'],
    },
    // ── PHỤ KIỆN SUB-CATEGORIES ──
    'keycap': {
        title: 'Keycap Sets PBT Chính Hãng — NexGear Cần Thơ',
        description: 'Keycap PBT, Cherry profile, SA profile chính hãng. Akko, GMK, ePBT tại Cần Thơ.',
        h1: 'Keycap Sets',
        keywords: ['keycap Cần Thơ', 'keycap PBT', 'Cherry profile', 'GMK keycap'],
    },
    'switch': {
        title: 'Switch Bàn Phím Cơ — NexGear Cần Thơ',
        description: 'Switch bàn phím cơ Gateron, Cherry MX, Kailh tại Cần Thơ. Linear, tactile, clicky.',
        h1: 'Switches',
        keywords: ['switch Cần Thơ', 'Gateron', 'Cherry MX', 'switch bàn phím'],
    },
    'mouse-pad': {
        title: 'Mouse Pad & Desk Mat — NexGear Cần Thơ',
        description: 'Lót chuột gaming, desk mat cao cấp. Artisan, Lethal Gaming Gear, X-raypad tại Cần Thơ.',
        h1: 'Mouse Pad',
        keywords: ['mouse pad Cần Thơ', 'lót chuột gaming', 'desk mat', 'Artisan'],
    },
    'cable-hub': {
        title: 'Cable & Hub USB-C — NexGear Cần Thơ',
        description: 'Cable USB-C, dock, hub chính hãng. Ugreen, Anker, Baseus tại Cần Thơ. Giao nhanh.',
        h1: 'Cable & Hub',
        keywords: ['cable USB-C Cần Thơ', 'hub USB', 'dock laptop', 'Ugreen'],
    },
    'wrist-rest': {
        title: 'Wrist Rest Kê Tay — NexGear Cần Thơ',
        description: 'Kê tay gỗ, silicone cho bàn phím & chuột. Glorious, custom wood tại Cần Thơ.',
        h1: 'Wrist Rest',
        keywords: ['wrist rest Cần Thơ', 'kê tay bàn phím', 'kê tay gỗ', 'wrist rest silicone'],
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
            url: `https://nexgzone.top/${category}`,
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
            canonical: `https://nexgzone.top/${category}`,
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
            { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: 'https://nexgzone.top/' },
            { '@type': 'ListItem', position: 2, name: seo.h1, item: `https://nexgzone.top/${category}` },
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
