// ============================================================
// NEXGEAR — Admin Layout
// File: app/admin/layout.tsx
// Dark theme admin dashboard with sidebar
// ============================================================
import type { Metadata } from 'next'
import AdminSidebar from '@/components/admin/AdminSidebar'
import styles from './layout.module.scss'

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
    return (
        <div className={styles.adminLayout}>
            <AdminSidebar />
            <div className={styles.mainContent}>
                <div className={styles.pageContent}>
                    {children}
                </div>
            </div>
        </div>
    )
}
