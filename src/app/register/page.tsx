import { Metadata } from 'next'
import RegisterClient from './RegisterClient'

export const metadata: Metadata = {
    title: 'Đăng Ký Tài Khoản',
    description: 'Tham gia NexGear ngay hôm nay để nhận thông báo khuyến mãi, theo dõi đơn hàng tại Cần Thơ.',
    robots: {
        index: false,
        follow: true,
    },
}

export default function RegisterPage() {
    return <RegisterClient />
}
