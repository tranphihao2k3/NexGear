// ============================================================
// NEXGEAR — Admin Sidebar Component
// File: components/admin/AdminSidebar.tsx
// ============================================================
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useAdminTheme } from '@/contexts/AdminThemeContext'
import { useSidebar } from '@/app/admin/AdminLayoutClient'
import {
    LayoutDashboard,
    FolderTree,
    Building2,
    Laptop,
    Users,
    Menu,
    X,
    LogOut,
    PanelLeftClose,
    PanelLeftOpen,
    Cpu,
    ShoppingCart,
    Megaphone,
    Shield,
    MessageSquare,
    Key,
    Package,
    Wrench,
    Settings,
    Bell,
    Star,
    MonitorDown,
    DollarSign,
    Gift,
    Eye,
    Tag,
    RefreshCcw,
    ArrowLeftRight,
    Warehouse,
    Wallet,
    History,
    HelpCircle,
    Percent,
    FileText,
} from 'lucide-react'
import styles from './AdminSidebar.module.scss'

interface NavItem {
    label: string
    href: string
    icon: React.ComponentType<any>
    badge?: number
}

const MENU_ITEMS: NavItem[] = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Đơn hàng', href: '/admin/orders', icon: ShoppingCart, badge: 3 },
    { label: 'Sản phẩm', href: '/admin/products', icon: Laptop },
    { label: 'Danh mục', href: '/admin/categories', icon: FolderTree },
    { label: 'Thương hiệu', href: '/admin/brands', icon: Building2 },
    { label: 'Kho hàng', href: '/admin/inventory', icon: Warehouse },
    { label: 'Nhà cung cấp', href: '/admin/suppliers', icon: Package },
    { label: 'Tài chính', href: '/admin/finance', icon: DollarSign },
    { label: 'Mã giảm giá', href: '/admin/coupons', icon: Gift },
    { label: 'Đánh giá', href: '/admin/reviews', icon: Star },
    { label: 'POS', href: '/admin/pos', icon: MonitorDown },
    { label: 'Khách hàng', href: '/admin/customers', icon: Users },
    { label: 'Thanh lý CĐ', href: '/admin/community', icon: RefreshCcw },
    // New features from LapLap
    { label: 'Linh kiện', href: '/admin/components', icon: Cpu },
    { label: 'Blog', href: '/admin/blog', icon: FileText },
    { label: 'Phiếu bảo hành', href: '/admin/warranty-cards', icon: Shield },
    { label: 'Dịch vụ', href: '/admin/services', icon: Wrench },
    { label: 'Thu mua máy cũ', href: '/admin/buyback-orders', icon: ArrowLeftRight },
    { label: 'Marketing', href: '/admin/marketing', icon: Megaphone },
    { label: 'Banner', href: '/admin/banners', icon: Megaphone },
    { label: 'Popup Banner', href: '/admin/popup-banners', icon: MessageSquare },
    { label: 'FAQ', href: '/admin/faqs', icon: HelpCircle },
    { label: 'Khuyến mãi', href: '/admin/promotions', icon: Percent },
    { label: 'Điểm tích lũy', href: '/admin/loyalty-points', icon: Star },
    { label: 'Phản hồi', href: '/admin/feedback', icon: MessageSquare },
    { label: 'Đổi trả', href: '/admin/returns', icon: RefreshCcw },
    { label: 'Phần mềm', href: '/admin/software', icon: MonitorDown },
    { label: 'Bản quyền', href: '/admin/licenses', icon: Key },
    { label: 'Đơn nhập hàng', href: '/admin/purchase-orders', icon: Package },
    { label: 'Kho bãi', href: '/admin/warehouses', icon: Warehouse },
    { label: 'Serial Numbers', href: '/admin/product-units', icon: Tag },
    { label: 'Lịch sử SP', href: '/admin/product-history', icon: History },
    { label: 'Công nợ', href: '/admin/debts', icon: Wallet },
    { label: 'Chấm công', href: '/admin/attendance', icon: Users },
    { label: 'Bảng lương', href: '/admin/salary', icon: DollarSign },
    { label: 'Nhân viên', href: '/admin/staff', icon: Users },
    { label: 'Audit Logs', href: '/admin/audit-logs', icon: FileText },
    { label: 'Thông báo', href: '/admin/notifications', icon: Bell },
    { label: 'Khách truy cập', href: '/admin/visitors', icon: Eye },
]

const SETTINGS_ITEMS: NavItem[] = [
    { label: 'Cài đặt', href: '/admin/settings', icon: Settings },
]

const ROLE_LABELS: Record<string, string> = {
    admin: 'Quản trị viên',
    manager: 'Quản lý',
    staff: 'Nhân viên',
    cashier: 'Thu ngân',
}

export default function AdminSidebar() {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)
    const { data: session } = useSession()
    const { theme, toggleTheme } = useAdminTheme()
    const { collapsed, setCollapsed } = useSidebar()

    const user = session?.user as any
    const userName = user?.name || 'Admin'
    const userRole = user?.role || 'admin'
    const initials = userName
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

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
                {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Overlay for mobile */}
            {open && (
                <div
                    className={styles.overlay}
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${open ? styles.open : ''} ${collapsed ? styles.collapsed : ''}`}>
                {/* Logo */}
                <div className={styles.logo}>
                    <Link href="/admin">
                        <div className={styles.logoContent}>
                            <div className={`${styles.logoText} ${collapsed ? styles.logoTextCollapsed : ''}`}>
                                <span className={styles.logoMain}>
                                    NEX<span className={styles.logoAccent}>GEAR</span>
                                </span>
                            </div>
                            {/* Collapsed Logo */}
                            <div className={`${styles.logoCollapsed} ${collapsed ? styles.logoCollapsedVisible : ''}`}>
                                <div className={styles.logoIcon}>
                                    N
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Collapse Toggle */}
                    <button
                        className={styles.collapseToggle}
                        onClick={() => setCollapsed(!collapsed)}
                        title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
                    >
                        {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className={styles.nav}>
                    <div className={`${styles.menuLabel} ${collapsed ? styles.menuLabelCollapsed : ''}`}>MENU</div>
                    {MENU_ITEMS.map((item) => {
                        const IconComponent = item.icon
                        const active = isActive(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${active ? styles.active : ''} ${collapsed ? styles.navItemCollapsed : ''}`}
                                onClick={() => setOpen(false)}
                                title={collapsed ? item.label : ''}
                            >
                                <div className={styles.navIcon}>
                                    <IconComponent className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                                </div>
                                <span className={`${styles.navText} ${collapsed ? styles.navTextCollapsed : ''}`}>
                                    {item.label}
                                </span>
                                {item.badge && item.badge > 0 && (
                                    <span className={styles.navBadge}>{item.badge}</span>
                                )}
                                {active && !collapsed && (
                                    <div className={styles.navActiveDot} />
                                )}
                            </Link>
                        )
                    })}

                    <div className={styles.divider} />

                    {SETTINGS_ITEMS.map((item) => {
                        const IconComponent = item.icon
                        const active = isActive(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${active ? styles.active : ''} ${collapsed ? styles.navItemCollapsed : ''}`}
                                onClick={() => setOpen(false)}
                                title={collapsed ? item.label : ''}
                            >
                                <div className={styles.navIcon}>
                                    <IconComponent className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                                </div>
                                <span className={`${styles.navText} ${collapsed ? styles.navTextCollapsed : ''}`}>
                                    {item.label}
                                </span>
                                {active && !collapsed && (
                                    <div className={styles.navActiveDot} />
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer: theme toggle + user info + logout */}
                <div className={styles.footer}>
                    <button
                        className={styles.themeToggle}
                        onClick={toggleTheme}
                        aria-label="Toggle admin theme"
                        title={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
                    >
                        <span className={styles.themeIcon}>
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </span>
                        <span className={`${styles.themeText} ${collapsed ? styles.themeTextCollapsed : ''}`}>
                            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                        </span>
                    </button>

                    <div className={styles.divider} />

                    <div className={`${styles.userInfo} ${collapsed ? styles.userInfoCollapsed : ''}`}>
                        <div className={styles.avatar}>{initials}</div>
                        <div className={`${styles.userMeta} ${collapsed ? styles.userMetaCollapsed : ''}`}>
                            <div className={styles.userName}>{userName}</div>
                            <div className={styles.userRole}>
                                {ROLE_LABELS[userRole] || userRole}
                            </div>
                        </div>
                    </div>

                    <button
                        className={styles.logoutBtn}
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        title={collapsed ? 'Đăng xuất' : ''}
                    >
                        <LogOut className="w-4 h-4" />
                        <span className={`${styles.logoutText} ${collapsed ? styles.logoutTextCollapsed : ''}`}>
                            Đăng xuất
                        </span>
                    </button>
                </div>
            </aside>
        </>
    )
}
