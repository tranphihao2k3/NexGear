// ============================================================
// NEXGEAR — Admin Sidebar Component
// File: components/admin/AdminSidebar.tsx
// ============================================================
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './AdminSidebar.module.scss'

interface NavItem {
    label: string
    href: string
    icon: string
    badge?: number
}

const MENU_ITEMS: NavItem[] = [
    { label: 'Dashboard', href: '/admin', icon: '📊' },
    { label: 'Đơn hàng', href: '/admin/orders', icon: '📦', badge: 3 },
    { label: 'Sản phẩm', href: '/admin/products', icon: '🎮' },
    { label: 'Danh mục', href: '/admin/categories', icon: '📁' },
    { label: 'Thương hiệu', href: '/admin/brands', icon: '🏷️' },
    { label: 'Kho hàng', href: '/admin/inventory', icon: '🏪' },
    { label: 'Nhà cung cấp', href: '/admin/suppliers', icon: '🏭' },
    { label: 'Tài chính', href: '/admin/finance', icon: '💰' },
    { label: 'Mã giảm giá', href: '/admin/coupons', icon: '🎟️' },
    { label: 'Đánh giá', href: '/admin/reviews', icon: '⭐' },
    { label: 'POS', href: '/admin/pos', icon: '🖥️' },
    { label: 'Khách hàng', href: '/admin/customers', icon: '👥' },
]

const SETTINGS_ITEMS: NavItem[] = [
    { label: 'Nhân viên', href: '/admin/staff', icon: '👤' },
    { label: 'Cài đặt', href: '/admin/settings', icon: '⚙️' },
]

export default function AdminSidebar() {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)

    const isActive = (href: string) => {
        if (href === '/admin') return pathname === '/admin'
        return pathname.startsWith(href)
    }

    return (
        <>
            {/* Mobile toggle */}
            <button
                className={styles.mobileToggle}
                onClick={() => setOpen(!open)}
                aria-label="Toggle sidebar"
            >
                {open ? '✕' : '☰'}
            </button>

            {/* Overlay for mobile */}
            {open && (
                <div
                    className={styles.overlay}
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${open ? styles.open : ''}`}>
                {/* Logo */}
                <div className={styles.logo}>
                    <Link href="/admin">
                        <span className={styles.logoText}>
                            NEX<span className={styles.logoAccent}>GEAR</span>
                        </span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className={styles.nav}>
                    <div className={styles.menuLabel}>MENU</div>
                    {MENU_ITEMS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
                            onClick={() => setOpen(false)}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            <span className={styles.navText}>{item.label}</span>
                            {item.badge && item.badge > 0 && (
                                <span className={styles.navBadge}>{item.badge}</span>
                            )}
                        </Link>
                    ))}

                    <div className={styles.divider} />

                    {SETTINGS_ITEMS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
                            onClick={() => setOpen(false)}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            <span className={styles.navText}>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* User info */}
                <div className={styles.footer}>
                    <div className={styles.userInfo}>
                        <div className={styles.avatar}>AD</div>
                        <div>
                            <div className={styles.userName}>Admin</div>
                            <div className={styles.userRole}>Quản trị viên</div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    )
}
