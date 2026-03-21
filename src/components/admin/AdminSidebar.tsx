// ============================================================
// NEXGEAR — Admin Sidebar Component
// File: components/admin/AdminSidebar.tsx
// ============================================================
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
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
    Search,
    ChevronDown,
    ChevronRight,
    CreditCard,
} from 'lucide-react'
import styles from './AdminSidebar.module.scss'

interface NavItem {
    label: string
    href: string
    icon: React.ComponentType<any>
    badge?: number
}

interface MenuGroup {
    title: string
    items: NavItem[]
}

const MENU_GROUPS: MenuGroup[] = [
    {
        title: 'Tổng quan',
        items: [
            { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        ]
    },
    {
        title: 'Bán hàng',
        items: [
            { label: 'Đơn hàng', href: '/admin/orders', icon: ShoppingCart, badge: 3 },
            { label: 'POS', href: '/admin/pos', icon: MonitorDown },
            { label: 'Khách hàng', href: '/admin/customers', icon: Users },
            { label: 'Đánh giá', href: '/admin/reviews', icon: Star },
            { label: 'Đổi trả', href: '/admin/returns', icon: RefreshCcw },
        ]
    },
    {
        title: 'Sản phẩm',
        items: [
            { label: 'Sản phẩm', href: '/admin/products', icon: Laptop },
            { label: 'Danh mục', href: '/admin/categories', icon: FolderTree },
            { label: 'Thương hiệu', href: '/admin/brands', icon: Building2 },
            { label: 'Linh kiện', href: '/admin/components', icon: Cpu },
        ]
    },
    {
        title: 'Kho hàng',
        items: [
            { label: 'Kho hàng', href: '/admin/inventory', icon: Warehouse },
            { label: 'Đơn nhập hàng', href: '/admin/purchase-orders', icon: Package },
            { label: 'Kho bãi', href: '/admin/warehouses', icon: Warehouse },
            { label: 'Serial Numbers', href: '/admin/product-units', icon: Tag },
            { label: 'Lịch sử SP', href: '/admin/product-history', icon: History },
            { label: 'Nhà cung cấp', href: '/admin/suppliers', icon: Package },
        ]
    },
    {
        title: 'Tài chính',
        items: [
            { label: 'Tài chính', href: '/admin/finance', icon: DollarSign },
            { label: 'Trả góp', href: '/admin/installments', icon: CreditCard },
            { label: 'Công nợ', href: '/admin/debts', icon: Wallet },
            { label: 'Mã giảm giá', href: '/admin/coupons', icon: Gift },
            { label: 'Khuyến mãi', href: '/admin/promotions', icon: Percent },
            { label: 'Điểm tích lũy', href: '/admin/loyalty-points', icon: Star },
        ]
    },
    {
        title: 'Marketing',
        items: [
            { label: 'Marketing', href: '/admin/marketing', icon: Megaphone },
            { label: 'Banner', href: '/admin/banners', icon: Megaphone },
            { label: 'Popup Banner', href: '/admin/popup-banners', icon: MessageSquare },
            { label: 'Blog', href: '/admin/blog', icon: FileText },
            { label: 'FAQ', href: '/admin/faqs', icon: HelpCircle },
        ]
    },
    {
        title: 'Dịch vụ',
        items: [
            { label: 'Phiếu bảo hành', href: '/admin/warranty-cards', icon: Shield },
            { label: 'Dịch vụ', href: '/admin/services', icon: Wrench },
            { label: 'Thu mua máy cũ', href: '/admin/buyback-orders', icon: ArrowLeftRight },
            { label: 'Phần mềm', href: '/admin/software', icon: MonitorDown },
            { label: 'Bản quyền', href: '/admin/licenses', icon: Key },
            { label: 'Thanh lý CĐ', href: '/admin/community', icon: RefreshCcw },
        ]
    },
    {
        title: 'Nhân sự',
        items: [
            { label: 'Nhân viên', href: '/admin/staff', icon: Users },
            { label: 'Chấm công', href: '/admin/attendance', icon: Users },
            { label: 'Bảng lương', href: '/admin/salary', icon: DollarSign },
        ]
    },
    {
        title: 'Hệ thống',
        items: [
            { label: 'Audit Logs', href: '/admin/audit-logs', icon: FileText },
            { label: 'Thông báo', href: '/admin/notifications', icon: Bell },
            { label: 'Khách truy cập', href: '/admin/visitors', icon: Eye },
            { label: 'Phản hồi', href: '/admin/feedback', icon: MessageSquare },
            { label: 'Cài đặt', href: '/admin/settings', icon: Settings },
        ]
    },
]

const ROLE_LABELS: Record<string, string> = {
    admin: 'Quản trị viên',
    manager: 'Quản lý',
    staff: 'Nhân viên',
    cashier: 'Thu ngân',
}

export default function AdminSidebar() {
    const pathname = usePathname()
    const { data: session } = useSession()
    const { theme, toggleTheme } = useAdminTheme()
    const { collapsed, setCollapsed, menuOpen: open, setMenuOpen: setOpen } = useSidebar()

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

    // Menu modal state
    const [menuSearch, setMenuSearch] = useState('')
    const [expandedGroups, setExpandedGroups] = useState<string[]>(MENU_GROUPS.map(g => g.title))
    const searchRef = useRef<HTMLDivElement>(null)

    // Keyboard shortcuts
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Ctrl+M or Cmd+M to toggle menu
        if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
            e.preventDefault()
            setOpen(prev => !prev)
        }
        // Escape to close menu
        if (e.key === 'Escape' && open) {
            setOpen(false)
        }
        // Ctrl+K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault()
            if (open && searchRef.current) {
                const input = searchRef.current.querySelector('input')
                input?.focus()
            }
        }
    }, [open])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    const toggleGroup = (title: string) => {
        setExpandedGroups(prev =>
            prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
        )
    }

    const filteredGroups = menuSearch
        ? MENU_GROUPS.map(group => ({
            ...group,
            items: group.items.filter(item =>
                item.label.toLowerCase().includes(menuSearch.toLowerCase())
            )
        })).filter(group => group.items.length > 0)
        : MENU_GROUPS

    // Close menu modal on route change
    useEffect(() => {
        setOpen(false)
    }, [pathname])

    return (
        <>
            {/* Full Screen Menu Modal */}
            {open && (
                <div className={styles.menuModal}>
                    <div className={styles.menuHeader}>
                        <div className={styles.headerLeft}>
                            <Link href="/admin" onClick={() => setOpen(false)} className={styles.menuLogo}>
                                NEX<span className={styles.menuLogoAccent}>GEAR</span>
                            </Link>
                        </div>

                        <div className={styles.searchWrapper} ref={searchRef}>
                            <div className={styles.searchInputGroup}>
                                <Search className="w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm công cụ, trang quản lý..."
                                    value={menuSearch}
                                    onChange={(e) => setMenuSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className={styles.searchHints}>
                                <span><kbd>↑↓</kbd> Di chuyển</span>
                                <span><kbd>Enter</kbd> Mở</span>
                                <span><kbd>ESC</kbd> Đóng</span>
                            </div>
                        </div>

                        <div className={styles.headerRight}>
                            <button
                                className={styles.menuClose}
                                onClick={() => setOpen(false)}
                                title="Đóng (Esc)"
                            >
                                <X className="w-6 h-6" />
                                <span>Đóng</span>
                            </button>
                        </div>
                    </div>

                    <div className={styles.menuContent}>
                        {filteredGroups.map((group) => (
                            <div key={group.title} className={styles.menuGroup}>
                                <div className={styles.menuGroupTitle}>
                                    {group.title}
                                </div>
                                <div className={styles.menuGroupItems}>
                                    {group.items.map((item) => {
                                        const IconComponent = item.icon
                                        const active = isActive(item.href)
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={`${styles.menuItem} ${active ? styles.menuItemActive : ''}`}
                                                onClick={() => setOpen(false)}
                                            >
                                                <div className={styles.menuItemIcon}>
                                                    <IconComponent className="w-5 h-5" />
                                                </div>
                                                <span className={styles.menuItemLabel}>{item.label}</span>
                                                {item.badge && item.badge > 0 && (
                                                    <span className={styles.menuBadge}>{item.badge}</span>
                                                )}
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            )}

            {/* Overlay */}
            {open && (
                <div className={styles.menuOverlay} onClick={() => setOpen(false)} />
            )}
        </>
    )
}
