// ============================================================
// NEXGEAR — Admin Layout
// File: app/admin/layout.tsx
// Dark/light theme admin dashboard with sidebar
// ============================================================
import type { Metadata } from 'next'
import { getSiteSettings } from '@/lib/site-config'
import AdminLayoutClient from './AdminLayoutClient'

export async function generateMetadata(): Promise<Metadata> {
    const s = await getSiteSettings()
    return {
        title: 'Admin Dashboard',
        description: `${s.storeName} — Quản lý cửa hàng`,
        robots: { index: false, follow: false },
    }
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <AdminLayoutClient>{children}</AdminLayoutClient>
}
