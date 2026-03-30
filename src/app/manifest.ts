import type { MetadataRoute } from 'next'
import { getSiteSettings } from '@/lib/site-config'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
    const { siteTitle, storeName, siteDescription } = await getSiteSettings()

    return {
        name: siteTitle,
        short_name: storeName,
        description: siteDescription,
        start_url: '/',
        display: 'standalone',
        background_color: '#0c0c0c',
        theme_color: '#00C4AD',
        icons: [
            {
                src: '/icon',
                sizes: '96x96',
                type: 'image/png',
            },
        ],
    }
}
