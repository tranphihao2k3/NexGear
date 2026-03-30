import { Metadata } from 'next'
import { getSiteSettings } from '@/lib/site-config'
import ProductsClient from './ProductsClient'

export async function generateMetadata(): Promise<Metadata> {
    const s = await getSiteSettings()
    return {
        title: 'Tất Cả Sản Phẩm Gear Gaming',
        description: `Khám phá tất cả các sản phẩm thiết bị ngoại vi và PC tại ${s.storeName} Cần Thơ. Giá tốt nhất thị trường, cam kết chính hãng.`,
        openGraph: {
            title: `Tất Cả Sản Phẩm Gear Gaming — ${s.storeName}`,
            description: `Mua sắm thiết bị máy tính cao cấp chính hãng tại ${s.storeName} Cần Thơ.`,
            url: `${s.siteDomain}/products`,
        },
    }
}

export default function ProductsPage() {
    return <ProductsClient />
}
