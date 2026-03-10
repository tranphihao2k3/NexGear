import { Metadata } from 'next'
import AdminLoginClient from './AdminLoginClient'
import { Suspense } from 'react'

export const metadata: Metadata = {
    title: 'NEXGEAR | Admin Login',
    description: 'Đăng nhập vào hệ thống quản trị NEXGEAR',
    robots: {
        index: false,
        follow: false,
    },
}

export default function AdminLoginPage() {
    return (
        <Suspense fallback={<div>Đang tải...</div>}>
            <AdminLoginClient />
        </Suspense>
    )
}
