import { Metadata } from 'next'
import CheckoutClient from './CheckoutClient'

export const metadata: Metadata = {
    title: 'Thanh Toán',
    description: 'Thanh toán đơn hàng nhanh chóng và bảo mật tại NexGear Cần Thơ.',
    robots: {
        index: false,
        follow: false,
    },
}

export default function CheckoutPage() {
    return <CheckoutClient />
}
