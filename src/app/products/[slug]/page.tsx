// ============================================================
// NEXGEAR — Chi Tiết Sản Phẩm (Server Component)
// File: app/products/[slug]/page.tsx
// SEO: generateMetadata, Product Schema, BreadcrumbList
// ============================================================
import type { Metadata } from 'next'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import ProductDetailClient from './ProductDetailClient'

// ── GENERATE METADATA ───────────────────────────────────────
export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>
}): Promise<Metadata> {
    const { slug } = await params

    try {
        await dbConnect()
        const product = await Product.findOne({ slug, isActive: true })
            .populate('brand', 'name')
            .populate('category', 'name slug')
            .lean()

        if (!product) {
            return {
                title: 'Sản phẩm không tìm thấy — NexGear',
                description: 'Sản phẩm này không tồn tại hoặc đã ngừng kinh doanh.',
            }
        }

        const price = product.salePrice || product.basePrice
        const priceFormatted = new Intl.NumberFormat('vi-VN').format(price) + '₫'
        const brandName = product.brand?.name || ''

        // Fallback sang tự sinh nếu seoTitle / seoDesc rỗng
        const title = product.seoTitle || `${product.name} Chính Hãng — Giá Tốt | NexGear`
        const description = product.seoDesc || `Mua ${product.name}${brandName ? ` ${brandName}` : ''} chính hãng tại NexGear Cần Thơ. Giá ${priceFormatted}, bảo hành 12T, đổi trả 7 ngày, giao nhanh 2H. Đặt ngay!`

        return {
            title: title.length > 60 ? `${product.name} — NexGear Cần Thơ` : title,
            description: description.substring(0, 160),
            keywords: [
                product.name,
                `${product.name} Cần Thơ`,
                `mua ${product.name}`,
                `${product.name} chính hãng`,
                brandName,
                `${brandName} Cần Thơ`,
            ].filter(Boolean),
            openGraph: {
                title,
                description: description.substring(0, 160),
                url: `https://nexgear.vn/products/${slug}`,
                siteName: 'NexGear',
                locale: 'vi_VN',
                type: 'website',
                images: product.images?.length > 0
                    ? product.images.slice(0, 3).map((img: string) => ({
                        url: img,
                        width: 800,
                        height: 800,
                        alt: product.name,
                    }))
                    : [{ url: '/og-image.jpg', width: 1200, height: 630 }],
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description: description.substring(0, 160),
                images: product.images?.[0] ? [product.images[0]] : ['/og-image.jpg'],
            },
            alternates: {
                canonical: `https://nexgear.vn/products/${slug}`,
            },
        }
    } catch {
        return {
            title: 'NexGear — Gear Máy Tính Chính Hãng Cần Thơ',
        }
    }
}

// ── PAGE COMPONENT (Server) ─────────────────────────────────
export default async function ProductPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params

    // Fetch data on server for JSON-LD schema
    let product: any = null
    try {
        await dbConnect()
        product = await Product.findOne({ slug, isActive: true })
            .populate('brand', 'name')
            .populate('category', 'name slug')
            .lean()
    } catch (err) {
        console.error('Failed to fetch product for schema:', err)
    }

    // ── JSON-LD Product Schema ──
    const productSchema = product ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description || '',
        image: product.images || [],
        sku: product.sku,
        brand: {
            '@type': 'Brand',
            name: product.brand?.name || '',
        },
        category: product.category?.name || '',
        url: `https://nexgear.vn/products/${slug}`,
        offers: {
            '@type': 'Offer',
            url: `https://nexgear.vn/products/${slug}`,
            priceCurrency: 'VND',
            price: product.salePrice || product.basePrice,
            priceValidUntil: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
            availability: product.stock > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            seller: {
                '@type': 'Organization',
                name: 'NexGear',
                url: 'https://nexgear.vn',
            },
        },
        ...(product.ratings?.count > 0 ? {
            aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: product.ratings.avg,
                reviewCount: product.ratings.count,
                bestRating: 5,
                worstRating: 1,
            },
        } : {}),
    } : null

    // ── JSON-LD BreadcrumbList ──
    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: 'https://nexgear.vn' },
            { '@type': 'ListItem', position: 2, name: 'Sản phẩm', item: 'https://nexgear.vn/products' },
            ...(product?.category ? [{
                '@type': 'ListItem',
                position: 3,
                name: product.category.name,
                item: `https://nexgear.vn/products/${product.category.slug}`,
            }] : []),
            ...(product ? [{
                '@type': 'ListItem',
                position: product?.category ? 4 : 3,
                name: product.name,
                item: `https://nexgear.vn/products/${slug}`,
            }] : []),
        ],
    }

    return (
        <>
            {/* Inject JSON-LD Schemas */}
            {productSchema && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
                />
            )}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />

            {/* Client interactive UI */}
            <ProductDetailClient slug={slug} />
        </>
    )
}
