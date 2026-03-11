import { Metadata } from 'next'
import SearchClient from './SearchClient'

export const metadata: Metadata = {
    title: 'Tìm Kiếm Sản Phẩm',
    description: 'Tìm kiếm hàng trăm sản phẩm tại NexGear Cần Thơ: Bàn phím cơ, chuột, tai nghe gaming.',
    openGraph: {
        title: 'Tìm Kiếm Sản Phẩm — NexGear',
        description: 'Tìm kiếm sản phẩm tại NexGear Cần Thơ',
        url: 'https://nexgzone.top/search',
    },
}

export default function SearchPage() {
    return <SearchClient />
}
