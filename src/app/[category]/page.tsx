// ============================================================
// NEXGEAR — Trang Danh Mục (Server Component)
// File: app/[category]/page.tsx
// SEO: generateMetadata, BreadcrumbList schema
// ============================================================
import type { Metadata } from 'next'
import { getSiteSettings } from '@/lib/site-config'
import CategoryClient from './CategoryClient'

// ── SEO META MAP ────────────────────────────────────────────
type CategorySeoEntry = { title: string; description: string; h1: string; keywords: string[] }

function getCategorySeo(addr: string): Record<string, CategorySeoEntry> {
    return {
    'ban-phim': {
        title: 'Bàn Phím Cơ Gaming Chính Hãng',
        description: `Mua bàn phím cơ gaming chính hãng tại ${addr}. Akko, Keychron, Razer — giá tốt, bảo hành 12T, giao nhanh 2H. Xem ngay!`,
        h1: 'Bàn Phím Cơ Gaming',
        keywords: [`bàn phím cơ ${addr}`, 'bàn phím gaming', 'bàn phím không dây', `mua bàn phím ${addr}`],
    },
    'chuot': {
        title: 'Chuột Gaming & Wireless Chính Hãng',
        description: `Chuột gaming, chuột không dây chính hãng Logitech, Razer, Pulsar tại ${addr}. Giá tốt nhất, đổi trả 7 ngày. Đặt hàng ngay!`,
        h1: 'Chuột Gaming & Wireless',
        keywords: [`chuột gaming ${addr}`, 'chuột không dây', 'chuột Logitech', `mua chuột ${addr}`],
    },
    'tai-nghe': {
        title: 'Tai Nghe Gaming & Hi-Fi Chính Hãng',
        description: `Tai nghe gaming, Hi-Fi, TWS chính hãng tại ${addr}. HyperX, Sony, Sennheiser — bảo hành 12T, giao nhanh. Mua ngay!`,
        h1: 'Tai Nghe Gaming & Hi-Fi',
        keywords: [`tai nghe gaming ${addr}`, 'tai nghe bluetooth', 'headphone Hi-Fi', `mua tai nghe ${addr}`],
    },
    'loa-mic': {
        title: 'Loa & Micro Stream Chính Hãng',
        description: `Mua loa bluetooth, micro stream, mic podcast chính hãng tại ${addr}. Edifier, HyperX, Razer — ship nhanh, giá tốt!`,
        h1: 'Loa & Micro Stream',
        keywords: [`loa bluetooth ${addr}`, 'micro stream', 'mic podcast', `mua loa ${addr}`],
    },
    'phu-kien': {
        title: 'Phụ Kiện Gaming & Keycap',
        description: `Keycap, lót chuột, switch, cable custom và phụ kiện gaming chính hãng tại ${addr}. Giá tốt, giao nhanh. Xem ngay!`,
        h1: 'Phụ Kiện Gaming & Keycap',
        keywords: [`phụ kiện bàn phím ${addr}`, 'keycap PBT', 'lót chuột gaming', 'switch Cherry'],
    },
    'laptop': {
        title: 'Laptop Gaming & Văn Phòng Chính Hãng',
        description: `Mua laptop gaming, laptop văn phòng chính hãng tại ${addr}. ASUS, Dell, HP, MacBook — giá tốt, trả góp 0%, bảo hành 12T. Xem ngay!`,
        h1: 'Laptop Gaming & Văn Phòng',
        keywords: [`laptop gaming ${addr}`, 'laptop văn phòng', `mua laptop ${addr}`, `MacBook ${addr}`],
    },
    // ── LAPTOP SUB-CATEGORIES ──
    'gaming-laptop': {
        title: 'Laptop Gaming Chính Hãng',
        description: `Laptop gaming hiệu năng cao ASUS ROG, MSI, Lenovo Legion tại ${addr}. RTX 50/40 Series, trả góp 0%, bảo hành 12T.`,
        h1: 'Laptop Gaming',
        keywords: [`laptop gaming ${addr}`, 'laptop gaming RTX', `ASUS ROG ${addr}`, 'MSI gaming'],
    },
    'ultrabook': {
        title: 'Ultrabook Mỏng Nhẹ Chính Hãng',
        description: `Ultrabook mỏng nhẹ, thời trang. MacBook, Dell XPS, ASUS ZenBook tại ${addr}. Giá tốt, giao nhanh 2H.`,
        h1: 'Ultrabook',
        keywords: [`ultrabook ${addr}`, 'laptop mỏng nhẹ', `MacBook ${addr}`, 'Dell XPS'],
    },
    'workstation': {
        title: 'Laptop Workstation Đồ Họa',
        description: `Laptop workstation cho đồ họa, lập trình, render 3D. ThinkPad, HP ZBook, Dell Precision tại ${addr}.`,
        h1: 'Laptop Workstation',
        keywords: [`laptop workstation ${addr}`, 'laptop đồ họa', 'laptop lập trình', 'ThinkPad'],
    },
    'laptop-sinh-vien': {
        title: 'Laptop Sinh Viên Giá Tốt',
        description: `Laptop sinh viên giá rẻ, phù hợp học tập và làm việc. Trả góp 0%, bảo hành 12T tại ${addr}.`,
        h1: 'Laptop Sinh Viên',
        keywords: [`laptop sinh viên ${addr}`, 'laptop giá rẻ', 'laptop học tập', 'laptop trả góp'],
    },
    // ── CHUỘT SUB-CATEGORIES ──
    'chuot-gaming': {
        title: 'Chuột Gaming Chính Hãng',
        description: `Chuột gaming chuyên nghiệp Logitech, Razer, Pulsar tại ${addr}. Sensor 26K DPI, đổi trả 7 ngày.`,
        h1: 'Chuột Gaming',
        keywords: [`chuột gaming ${addr}`, 'chuột Razer', 'chuột Logitech', 'chuột chơi game'],
    },
    'chuot-wireless': {
        title: 'Chuột Wireless Không Dây',
        description: `Chuột không dây chính hãng Logitech, Razer tại ${addr}. Kết nối Bluetooth & 2.4GHz, giá tốt.`,
        h1: 'Chuột Wireless',
        keywords: [`chuột không dây ${addr}`, 'chuột wireless', 'chuột bluetooth', 'chuột Logitech wireless'],
    },
    'chuot-ergonomic': {
        title: 'Chuột Ergonomic Công Thái Học',
        description: `Chuột ergonomic thiết kế công thái học, chống mỏi tay. Logitech MX, Razer Pro tại ${addr}.`,
        h1: 'Chuột Ergonomic',
        keywords: [`chuột ergonomic ${addr}`, 'chuột công thái học', 'Logitech MX', 'chuột văn phòng'],
    },
    'chuot-sieu-nhe': {
        title: 'Chuột Siêu Nhẹ Dưới 60g',
        description: `Chuột siêu nhẹ dưới 60g cho game FPS. Pulsar, Finalmouse, Lamzu tại ${addr}.`,
        h1: 'Chuột Siêu Nhẹ',
        keywords: [`chuột siêu nhẹ ${addr}`, 'chuột nhẹ gaming', 'Pulsar', 'Finalmouse'],
    },
    // ── BÀN PHÍM SUB-CATEGORIES ──
    'ban-phim-co': {
        title: 'Bàn Phím Cơ Chính Hãng',
        description: `Bàn phím cơ mechanical cao cấp Akko, Keychron, Razer tại ${addr}. Cherry MX, Gateron, giá tốt.`,
        h1: 'Bàn Phím Cơ',
        keywords: [`bàn phím cơ ${addr}`, 'mechanical keyboard', 'bàn phím Akko', 'Cherry MX'],
    },
    'ban-phim-khong-day': {
        title: 'Bàn Phím Không Dây',
        description: `Bàn phím không dây Bluetooth, 2.4GHz chính hãng. Keychron, Logitech tại ${addr}.`,
        h1: 'Bàn Phím Không Dây',
        keywords: [`bàn phím không dây ${addr}`, 'bàn phím bluetooth', 'Keychron wireless'],
    },
    'ban-phim-tkl': {
        title: 'Bàn Phím TKL / 75% Compact',
        description: `Bàn phím TKL, 75% compact tiết kiệm không gian. Akko, Keychron, Monsgeek tại ${addr}.`,
        h1: 'Bàn Phím TKL / 75%',
        keywords: [`bàn phím TKL ${addr}`, 'bàn phím 75%', 'bàn phím compact'],
    },
    'ban-phim-60': {
        title: 'Bàn Phím 60% / 65% Ultra Compact',
        description: `Bàn phím 60%, 65% ultra compact tối giản. Tofu, Zoom65, KBD67 tại ${addr}.`,
        h1: 'Bàn Phím 60% / 65%',
        keywords: [`bàn phím 60% ${addr}`, 'bàn phím 65%', 'bàn phím mini'],
    },
    'custom-kit': {
        title: 'Custom Keyboard Kit & Barebone',
        description: `Kit barebone custom keyboard, DIY kit gasket mount. QK65, Zoom75, Monsgeek tại ${addr}.`,
        h1: 'Custom Kit',
        keywords: [`custom keyboard ${addr}`, 'barebone kit', 'DIY keyboard', 'gasket mount'],
    },
    // ── TAI NGHE SUB-CATEGORIES ──
    'tai-nghe-over-ear': {
        title: 'Tai Nghe Over-ear Chính Hãng',
        description: `Tai nghe over-ear trùm tai, bass sâu. Sony, Sennheiser, HyperX tại ${addr}. Bảo hành 12T.`,
        h1: 'Tai Nghe Over-ear',
        keywords: [`tai nghe over-ear ${addr}`, 'headphone', 'tai nghe Sony', 'Sennheiser'],
    },
    'tai-nghe-in-ear': {
        title: 'Tai Nghe In-ear & TWS',
        description: `Tai nghe in-ear, true wireless stereo chính hãng. Sony, Samsung, Moondrop tại ${addr}.`,
        h1: 'Tai Nghe In-ear / TWS',
        keywords: [`tai nghe in-ear ${addr}`, 'TWS', 'tai nghe true wireless', 'earbuds'],
    },
    'tai-nghe-gaming': {
        title: 'Tai Nghe Gaming 7.1',
        description: `Tai nghe gaming âm thanh vòm 7.1. HyperX, Razer, SteelSeries tại ${addr}. Giá tốt, bảo hành 12T.`,
        h1: 'Tai Nghe Gaming',
        keywords: [`tai nghe gaming ${addr}`, 'headset gaming', 'HyperX', 'tai nghe 7.1'],
    },
    // ── LOA SUB-CATEGORIES ──
    'soundbar': {
        title: 'Soundbar Cho Bàn Setup',
        description: `Soundbar, loa thanh cho bàn setup gaming & văn phòng. Edifier, Creative tại ${addr}.`,
        h1: 'Soundbar',
        keywords: [`soundbar ${addr}`, 'loa thanh', 'soundbar gaming', 'Edifier soundbar'],
    },
    'loa-bluetooth': {
        title: 'Loa Bluetooth Di Động',
        description: `Loa bluetooth di động, pin lâu. JBL, Marshall, Sony tại ${addr}. Giá tốt, giao nhanh.`,
        h1: 'Loa Bluetooth',
        keywords: [`loa bluetooth ${addr}`, 'loa di động', 'loa JBL', 'loa Marshall'],
    },
    'loa-desktop': {
        title: 'Loa Desktop 2.0 / 2.1',
        description: `Loa desktop 2.0, 2.1 cho PC gaming & văn phòng. Edifier, Creative, Harman tại ${addr}.`,
        h1: 'Loa Desktop',
        keywords: [`loa desktop ${addr}`, 'loa PC', 'loa 2.1', 'Edifier'],
    },
    // ── PHỤ KIỆN SUB-CATEGORIES ──
    'keycap': {
        title: 'Keycap Sets PBT Chính Hãng',
        description: `Keycap PBT, Cherry profile, SA profile chính hãng. Akko, GMK, ePBT tại ${addr}.`,
        h1: 'Keycap Sets',
        keywords: [`keycap ${addr}`, 'keycap PBT', 'Cherry profile', 'GMK keycap'],
    },
    'switch': {
        title: 'Switch Bàn Phím Cơ',
        description: `Switch bàn phím cơ Gateron, Cherry MX, Kailh tại ${addr}. Linear, tactile, clicky.`,
        h1: 'Switches',
        keywords: [`switch ${addr}`, 'Gateron', 'Cherry MX', 'switch bàn phím'],
    },
    'mouse-pad': {
        title: 'Mouse Pad & Desk Mat',
        description: `Lót chuột gaming, desk mat cao cấp. Artisan, Lethal Gaming Gear, X-raypad tại ${addr}.`,
        h1: 'Mouse Pad',
        keywords: [`mouse pad ${addr}`, 'lót chuột gaming', 'desk mat', 'Artisan'],
    },
    'cable-hub': {
        title: 'Cable & Hub USB-C',
        description: `Cable USB-C, dock, hub chính hãng. Ugreen, Anker, Baseus tại ${addr}. Giao nhanh.`,
        h1: 'Cable & Hub',
        keywords: [`cable USB-C ${addr}`, 'hub USB', 'dock laptop', 'Ugreen'],
    },
    'wrist-rest': {
        title: 'Wrist Rest Kê Tay',
        description: `Kê tay gỗ, silicone cho bàn phím & chuột. Glorious, custom wood tại ${addr}.`,
        h1: 'Wrist Rest',
        keywords: [`wrist rest ${addr}`, 'kê tay bàn phím', 'kê tay gỗ', 'wrist rest silicone'],
    },
    // ── LINH KIỆN SUB-CATEGORIES ──
    'linh-kien': {
        title: 'Linh Kiện PC & Laptop Chính Hãng',
        description: `Linh kiện nâng cấp PC & Laptop chính hãng giá tốt. RAM, SSD, sạc laptop, pin laptop tại ${addr}.`,
        h1: 'Linh Kiện PC & Laptop',
        keywords: ['linh kiện pc', `linh kiện laptop ${addr}`, 'nâng cấp laptop'],
    },
    'ram': {
        title: 'RAM PC & Laptop Chính Hãng',
        description: `RAM DDR4, DDR5 cho PC & Laptop. Nâng cấp RAM giá tốt, lắp đặt miễn phí tại ${addr}.`,
        h1: 'RAM Cấp Tốc',
        keywords: ['ram pc', 'ram laptop', `nâng cấp ram ${addr}`, 'ram ddr4', 'ram ddr5'],
    },
    'ssd': {
        title: 'Ổ Cứng SSD NVMe & SATA',
        description: `Ổ cứng SSD tốc độ cao, chính hãng Samsung, WD, Kingston. Nâng cấp SSD tại ${addr}.`,
        h1: 'Ổ Cứng SSD',
        keywords: [`ssd ${addr}`, 'ổ cứng ssd', 'ổ cứng nvme', 'nâng cấp ssd'],
    },
    'sac-laptop': {
        title: 'Sạc Laptop Chính Hãng',
        description: 'Sạc pin laptop chính hãng Dell, HP, ASUS, Lenovo. Sạc zin, chuẩn Type-C.',
        h1: 'Sạc Laptop',
        keywords: [`sạc laptop ${addr}`, 'sạc pin laptop', 'sạc macbook', 'sạc type-c'],
    },
    'pin-laptop': {
        title: 'Pin Laptop Thay Thế Chính Hãng',
        description: `Pin laptop thay thế chính hãng Dell, HP, ASUS, MacBook. Bảo hành uy tín tại ${addr}.`,
        h1: 'Pin Laptop',
        keywords: [`pin laptop ${addr}`, 'thay pin laptop', 'pin macbook', 'pin dell'],
    },
    'tannhiet': {
        title: 'Tản Nhiệt PC & Laptop',
        description: `Quạt tản nhiệt, tản tháp, tản nước AIO và keo tản nhiệt chính hãng tại ${addr}.`,
        h1: 'Tản Nhiệt',
        keywords: [`tản nhiệt ${addr}`, 'quạt tản nhiệt', 'keo tản nhiệt', 'tản nước AIO'],
    },
}
}

// ── GENERATE METADATA ───────────────────────────────────────
export async function generateMetadata({
    params,
}: {
    params: Promise<{ category: string }>
}): Promise<Metadata> {
    const { category } = await params
    const s = await getSiteSettings()
    const seo = getCategorySeo(s.storeAddress)[category]

    if (!seo) {
        return {
            title: `Danh mục sản phẩm — ${s.storeName} ${s.storeAddress}`,
            description: `Khám phá danh mục sản phẩm gaming gear chính hãng tại ${s.storeName} ${s.storeAddress}.`,
        }
    }

    return {
        title: seo.title,
        description: seo.description,
        keywords: seo.keywords,
        openGraph: {
            title: seo.title,
            description: seo.description,
            url: `${s.siteDomain}/${category}`,
            siteName: s.storeName,
            locale: 'vi_VN',
            type: 'website',
            images: [{ url: s.ogImage, width: 1200, height: 630 }],
        },
        twitter: {
            card: 'summary_large_image',
            title: seo.title,
            description: seo.description,
        },
        alternates: {
            canonical: `${s.siteDomain}/${category}`,
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
    const s = await getSiteSettings()
    const catSeo = getCategorySeo(s.storeAddress)
    const seo = catSeo[category] || catSeo['ban-phim']

    // JSON-LD BreadcrumbList
    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: `${s.siteDomain}/` },
            { '@type': 'ListItem', position: 2, name: seo.h1, item: `${s.siteDomain}/${category}` },
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
