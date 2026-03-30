import { Metadata } from 'next'
import { getSiteSettings } from '@/lib/site-config'
import CartClient from './CartClient'

export async function generateMetadata(): Promise<Metadata> {
    const s = await getSiteSettings()
    return {
        title: 'Giỏ Hàng',
        description: `Xem lại giỏ hàng của bạn. ${s.storeName} Cần Thơ — Gear máy tính chính hãng, giao nhanh toàn quốc.`,
        robots: {
            index: false,
            follow: true,
        },
    }
}

export default function CartPage() {
    return <CartClient />
}
