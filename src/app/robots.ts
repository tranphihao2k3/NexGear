// ============================================================
// NEXGEAR — robots.txt
// File: app/robots.ts
// Configure search engine crawlers directives
// ============================================================
import type { MetadataRoute } from 'next'
import { getSiteSettings } from '@/lib/site-config'

export default async function robots(): Promise<MetadataRoute.Robots> {
    const { siteDomain } = await getSiteSettings()

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin/', '/api/', '/checkout/', '/payment/', '/account/', '/login', '/register', '/cart', '/wishlist', '/community/new', '/community/my-listings'],
            },
            {
                userAgent: 'Googlebot-Image',
                allow: '/_next/image*',
            },
        ],
        sitemap: `${siteDomain}/sitemap.xml`,
        host: `${siteDomain}/`,
    }
}
