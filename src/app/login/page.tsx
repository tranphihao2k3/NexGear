import { Metadata } from 'next'
import LoginClient from './LoginClient'

export const metadata: Metadata = {
    title: 'Đăng Nhập',
    description: 'Đăng nhập vào tài khoản NexGear để quản lý đơn hàng, theo dõi giao hàng và tích lũy điểm thưởng.',
    robots: {
        index: false,
        follow: true,
    },
}

import { Suspense } from 'react'

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Đang tải...</div>}>
            <LoginClient />
        </Suspense>
    )
}
