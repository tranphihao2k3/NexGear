import { Metadata } from 'next'
import CartClient from './CartClient'

export const metadata: Metadata = {
    title: 'Giỏ Hàng',
    description: 'Xem lại giỏ hàng của bạn. NexGear Cần Thơ — Gear máy tính chính hãng, giao nhanh toàn quốc.',
    robots: {
        index: false,
        follow: true,
    },
}

export default function CartPage() {
    return <CartClient />
}
