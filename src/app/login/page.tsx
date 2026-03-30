import { Metadata } from 'next'
import { getSiteSettings } from '@/lib/site-config'
import LoginClient from './LoginClient'

export async function generateMetadata(): Promise<Metadata> {
    const s = await getSiteSettings()
    return {
        title: 'Đăng Nhập',
        description: `Đăng nhập vào tài khoản ${s.storeName} để quản lý đơn hàng, theo dõi giao hàng và tích lũy điểm thưởng.`,
        robots: {
            index: false,
            follow: true,
        },
    }
}

import { Suspense } from 'react'

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Đang tải...</div>}>
            <LoginClient />
        </Suspense>
    )
}
