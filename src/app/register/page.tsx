import { Metadata } from 'next'
import { getSiteSettings } from '@/lib/site-config'
import RegisterClient from './RegisterClient'

export async function generateMetadata(): Promise<Metadata> {
    const s = await getSiteSettings()
    return {
        title: 'Đăng Ký Tài Khoản',
        description: `Tham gia ${s.storeName} ngay hôm nay để nhận thông báo khuyến mãi, theo dõi đơn hàng tại Cần Thơ.`,
        robots: {
            index: false,
            follow: true,
        },
    }
}

export default function RegisterPage() {
    return <RegisterClient />
}
