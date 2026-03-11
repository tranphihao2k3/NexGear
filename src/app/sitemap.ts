// ============================================================
// NEXGEAR — Dynamic Sitemap
// File: app/sitemap.ts
// Generate sitemap.xml dynamically from DB for products + community
// ============================================================
import type { MetadataRoute } from 'next'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import CommunityListing from '@/models/CommunityListing'
import Blog from '@/models/Blog'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://nexgzone.top'

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
        // Category pages
        { url: `${baseUrl}/laptop`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: `${baseUrl}/ban-phim`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: `${baseUrl}/chuot`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: `${baseUrl}/tai-nghe`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: `${baseUrl}/loa-mic`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: `${baseUrl}/phu-kien`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        // Other public pages
        { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
        { url: `${baseUrl}/deals`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.8 },
        { url: `${baseUrl}/community`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
        { url: `${baseUrl}/thu-cu-doi-moi`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
        { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
        { url: `${baseUrl}/compare`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.4 },
    ]

    // Dynamic pages from DB
    try {
        await dbConnect()

        // Products
        const products = await Product.find({ isActive: true })
            .select('slug updatedAt')
            .lean()

        const productPages: MetadataRoute.Sitemap = products.map((product: any) => ({
            url: `${baseUrl}/products/${product.slug}`,
            lastModified: product.updatedAt || new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }))

        // Community listings
        let communityPages: MetadataRoute.Sitemap = []
        try {
            const listings = await CommunityListing.find({ status: 'approved' })
                .select('slug updatedAt')
                .lean()
            communityPages = listings.map((listing: any) => ({
                url: `${baseUrl}/community/${listing.slug}`,
                lastModified: listing.updatedAt || new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.5,
            }))
        } catch { /* CommunityListing model may not exist yet */ }

        // Blog posts
        let blogPages: MetadataRoute.Sitemap = []
        try {
            const posts = await Blog.find({ isPublished: true })
                .select('slug updatedAt')
                .lean()
            blogPages = posts.map((post: any) => ({
                url: `${baseUrl}/blog/${post.slug}`,
                lastModified: post.updatedAt || new Date(),
                changeFrequency: 'monthly' as const,
                priority: 0.6,
            }))
        } catch { /* Blog model may not exist yet */ }

        return [...staticPages, ...productPages, ...communityPages, ...blogPages]
    } catch (err) {
        console.error('Failed to generate dynamic sitemaps:', err)
        return staticPages
    }
}
