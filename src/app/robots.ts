// ============================================================
// NEXGEAR — robots.txt
// File: app/robots.ts
// Configure search engine crawlers directives
// ============================================================
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin/', '/api/', '/checkout/', '/payment/', '/account/'],
            },
            {
                userAgent: 'Googlebot-Image',
                allow: '/_next/image*',
            },
        ],
        sitemap: 'https://nexgear.vn/sitemap.xml',
        host: 'https://nexgear.vn',
    }
}
