import { Metadata } from 'next'
import WishlistClient from './WishlistClient'

export const metadata: Metadata = {
    title: 'Danh Sách Yêu Thích',
    description: 'Quản lý danh sách sản phẩm yêu thích của bạn tại NexGear Cần Thơ.',
    robots: {
        index: false,
        follow: true,
    },
}

export default function WishlistPage() {
    return <WishlistClient />
}
