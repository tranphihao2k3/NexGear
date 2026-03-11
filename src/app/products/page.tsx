import { Metadata } from 'next'
import ProductsClient from './ProductsClient'

export const metadata: Metadata = {
    title: 'Tất Cả Sản Phẩm Gear Gaming',
    description: 'Khám phá tất cả các sản phẩm thiết bị ngoại vi và PC tại NexGear Cần Thơ. Giá tốt nhất thị trường, cam kết chính hãng.',
    openGraph: {
        title: 'Tất Cả Sản Phẩm Gear Gaming — NexGear',
        description: 'Mua sắm thiết bị máy tính cao cấp chính hãng tại NexGear Cần Thơ.',
        url: 'https://nexgzone.top/products',
    },
}

export default function ProductsPage() {
    return <ProductsClient />
}
