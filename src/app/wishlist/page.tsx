import { Metadata } from 'next'
import { getSiteSettings } from '@/lib/site-config'
import WishlistClient from './WishlistClient'

export async function generateMetadata(): Promise<Metadata> {
    const s = await getSiteSettings()
    return {
        title: 'Danh Sách Yêu Thích',
        description: `Quản lý danh sách sản phẩm yêu thích của bạn tại ${s.storeName} Cần Thơ.`,
        robots: {
            index: false,
            follow: true,
        },
    }
}

export default function WishlistPage() {
    return <WishlistClient />
}
