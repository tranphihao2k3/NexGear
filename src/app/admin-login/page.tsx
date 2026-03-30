import { Metadata } from 'next'
import { getSiteSettings } from '@/lib/site-config'
import AdminLoginClient from './AdminLoginClient'
import { Suspense } from 'react'

export async function generateMetadata(): Promise<Metadata> {
    const s = await getSiteSettings()
    return {
        title: `${s.storeName} | Admin Login`,
        description: `Đăng nhập vào hệ thống quản trị ${s.storeName}`,
        robots: {
            index: false,
            follow: false,
        },
    }
}

export default function AdminLoginPage() {
    return (
        <Suspense fallback={<div>Đang tải...</div>}>
            <AdminLoginClient />
        </Suspense>
    )
}
