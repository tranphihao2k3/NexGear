import { Metadata } from 'next'
import { getSiteSettings } from '@/lib/site-config'
import SearchClient from './SearchClient'

export async function generateMetadata(): Promise<Metadata> {
    const s = await getSiteSettings()
    return {
        title: 'Tìm Kiếm Sản Phẩm',
        description: `Tìm kiếm hàng trăm sản phẩm tại ${s.storeName} Cần Thơ: Bàn phím cơ, chuột, tai nghe gaming.`,
        openGraph: {
            title: `Tìm Kiếm Sản Phẩm — ${s.storeName}`,
            description: `Tìm kiếm sản phẩm tại ${s.storeName} Cần Thơ`,
            url: `${s.siteDomain}/search`,
        },
    }
}

export default function SearchPage() {
    return <SearchClient />
}
