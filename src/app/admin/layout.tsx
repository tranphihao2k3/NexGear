// ============================================================
// NEXGEAR — Admin Layout
// File: app/admin/layout.tsx
// Dark/light theme admin dashboard with sidebar
// ============================================================
import type { Metadata } from 'next'
import AdminLayoutClient from './AdminLayoutClient'

export const metadata: Metadata = {
    title: 'Admin Dashboard',
    description: 'NEXGEAR — Quản lý cửa hàng',
    robots: { index: false, follow: false },
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <AdminLayoutClient>{children}</AdminLayoutClient>
}
