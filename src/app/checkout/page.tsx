import { Metadata } from 'next'
import { getSiteSettings } from '@/lib/site-config'
import CheckoutClient from './CheckoutClient'

export async function generateMetadata(): Promise<Metadata> {
    const s = await getSiteSettings()
    return {
        title: 'Thanh Toán',
        description: `Thanh toán đơn hàng nhanh chóng và bảo mật tại ${s.storeName} Cần Thơ.`,
        robots: {
            index: false,
            follow: false,
        },
    }
}

export default function CheckoutPage() {
    return <CheckoutClient />
}
