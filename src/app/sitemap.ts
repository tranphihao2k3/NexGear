// ============================================================
// NEXGEAR — Dynamic Sitemap
// File: app/sitemap.ts
// Generate sitemap.xml dynamically from DB for products
// ============================================================
import type { MetadataRoute } from 'next'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://nexgear.vn'

    // Các trang gốc (Static)
    const staticPages: MetadataRoute.Sitemap = [
        { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
        { url: `${baseUrl}/ban-phim`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: `${baseUrl}/chuot`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: `${baseUrl}/tai-nghe`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: `${baseUrl}/loa-mic`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: `${baseUrl}/phu-kien`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: `${baseUrl}/deals`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.8 },
    ]

    // Fetch product slugs cho các trang động
    try {
        await dbConnect()
        const products = await Product.find({ isActive: true })
            .select('slug updatedAt')
            .lean()

        const productPages: MetadataRoute.Sitemap = products.map((product: any) => ({
            url: `${baseUrl}/products/${product.slug}`,
            lastModified: product.updatedAt || new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }))

        return [...staticPages, ...productPages]
    } catch (err) {
        console.error('Failed to generate dynamic product sitemaps:', err)
        return staticPages
    }
}
