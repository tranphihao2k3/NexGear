// ============================================================
// NEXGEAR — Navbar Component (Clean + Mega Menu)
// ============================================================
'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from '@/contexts/ThemeContext'
import { useCompareStore } from '@/store/useCompareStore'
import styles from './Navbar.module.scss'

interface ApiCategory {
    _id: string
    name: string
    slug: string
    icon?: string
    description?: string
    children?: ApiCategory[]
}

interface NavLink {
    href: string
    label: string
    sub?: { href: string; label: string; desc?: string }[]
}

const SERVICE_MENU: NavLink = {
    href: '/sua-chua-laptop',
    label: 'Dịch vụ',
    sub: [
        { href: '/sua-chua-laptop', label: 'Sửa chữa Laptop', desc: 'Chẩn đoán, sửa chữa chuyên nghiệp' },
        { href: '/thu-cu-doi-moi', label: 'Thu cũ đổi mới', desc: 'Lên đời laptop, trợ giá tốt' },
    ],
}

const MORE_LINKS: { href: string; label: string; highlight?: boolean }[] = [
    { href: '/blog', label: 'Blog' },
    { href: '/deals', label: 'Flash Deal', highlight: true },
]

interface NavbarProps {
    cartCount?: number
}

export default function Navbar({ cartCount = 0 }: NavbarProps) {
    const { data: session } = useSession()
    const pathname = usePathname()
    const { theme, toggleTheme } = useTheme()
    const [menuOpen, setMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
    const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)
    const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

    const compareCount = useCompareStore(state => state.items.length)
    const [isMounted, setIsMounted] = useState(false)
    const [categories, setCategories] = useState<NavLink[]>([
        {
            href: '/laptop',
            label: 'Laptop',
            sub: [
                { href: '/gaming-laptop', label: 'Gaming Laptop', desc: 'Laptop hiệu năng cao cho game' },
                { href: '/ultrabook', label: 'Ultrabook', desc: 'Mỏng nhẹ, thời trang' },
                { href: '/workstation', label: 'Workstation', desc: 'Đồ họa, lập trình chuyên nghiệp' },
                { href: '/laptop-sinh-vien', label: 'Laptop Sinh Viên', desc: 'Giá tốt, phù hợp học tập' },
            ]
        },
        {
            href: '/ban-phim',
            label: 'Bàn Phím',
            sub: [
                { href: '/ban-phim-co', label: 'Bàn Phím Cơ', desc: 'Mechanical keyboard cao cấp' },
                { href: '/ban-phim-khong-day', label: 'Bàn Phím Không Dây', desc: 'Wireless & Bluetooth' },
                { href: '/ban-phim-tkl', label: 'Bàn Phím TKL / 75%', desc: 'Compact, tiết kiệm không gian' },
                { href: '/ban-phim-60', label: 'Bàn Phím 60% / 65%', desc: 'Ultra compact, tối giản' },
                { href: '/custom-kit', label: 'Custom Kit', desc: 'Barebone & DIY kit' },
            ]
        },
        {
            href: '/chuot',
            label: 'Chuột',
            sub: [
                { href: '/chuot-gaming', label: 'Chuột Gaming', desc: 'Chuột chơi game chuyên nghiệp' },
                { href: '/chuot-wireless', label: 'Chuột Wireless', desc: 'Không dây, tự do di chuyển' },
                { href: '/chuot-ergonomic', label: 'Chuột Ergonomic', desc: 'Thiết kế công thái học' },
                { href: '/chuot-sieu-nhe', label: 'Chuột Siêu Nhẹ', desc: 'Dưới 60g, linh hoạt tối đa' },
            ]
        },
        {
            href: '/linh-ki-n',
            label: 'Linh Kiện',
            sub: [
                { href: '/bo-nho-ram', label: 'Bộ nhớ Ram', desc: '' },
                { href: '/day-sac-asus', label: 'Dây Sạc', desc: '' },
                { href: '/ssd-512gb', label: 'Ổ cứng SSD', desc: '' },
            ]
        },
        {
            href: '/loa',
            label: 'Loa',
            sub: [
                { href: '/soundbar', label: 'Soundbar', desc: 'Loa thanh cho bàn setup' },
                { href: '/loa-bluetooth', label: 'Loa Bluetooth', desc: 'Di động, pin lâu' },
                { href: '/loa-desktop', label: 'Loa Desktop', desc: '2.0 / 2.1 cho PC' },
            ]
        },
        {
            href: '/lot-chuot',
            label: 'Lót Chuột',
        },
        {
            href: '/phu-kien',
            label: 'Phụ kiện',
            sub: [
                { href: '/keycap', label: 'Keycap Sets', desc: 'PBT, Cherry profile...' },
                { href: '/switch', label: 'Switches', desc: 'Gateron, Cherry MX...' },
                { href: '/mouse-pad', label: 'Mouse Pad', desc: 'Desk mat & gaming pad' },
                { href: '/cable-hub', label: 'Cable & Hub', desc: 'USB-C, Dock, Hub' },
                { href: '/wrist-rest', label: 'Wrist Rest', desc: 'Kê tay gỗ, silicone' },
            ]
        },
        {
            href: '/tai-nghe',
            label: 'Tai Nghe',
            sub: [
                { href: '/tai-nghe-over-ear', label: 'Tai Nghe Over-ear', desc: 'Trùm tai, bass sâu' },
                { href: '/tai-nghe-in-ear', label: 'Tai Nghe In-ear / TWS', desc: 'True wireless stereo' },
                { href: '/tai-nghe-gaming', label: 'Tai Nghe Gaming', desc: 'Âm thanh vòm 7.1' },
            ]
        }
    ])

    useEffect(() => {
        setIsMounted(true)

        fetch('/api/categories?tree=true&active=true')
            .then(r => r.json())
            .then(d => {
                if (d.success && Array.isArray(d.data)) {
                    const mappedCats = d.data.map((cat: ApiCategory) => ({
                        href: `/${cat.slug}`,
                        label: cat.name,
                        sub: cat.children?.length
                            ? cat.children.map(ch => ({ href: `/${ch.slug}`, label: ch.name, desc: ch.description || '' }))
                            : undefined,
                    }))

                    // Đưa "Laptop" lên đầu
                    mappedCats.sort((a: NavLink, b: NavLink) => {
                        if (a.label.toLowerCase() === 'laptop') return -1;
                        if (b.label.toLowerCase() === 'laptop') return 1;
                        return 0;
                    })

                    setCategories(mappedCats)
                }
            })
            .catch(() => {})

        return () => {}
    }, [])

    useEffect(() => { setMenuOpen(false) }, [pathname])

    function handleMouseEnter(href: string) {
        if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current)
        setActiveDropdown(href)
    }

    function handleMouseLeave() {
        dropdownTimeout.current = setTimeout(() => setActiveDropdown(null), 200)
    }

    return (
        <>
            <header className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
                <div className={styles.scanLines} aria-hidden="true" />

                {/* ── TOP BAR ── */}
                <div className={styles.topBar}>
                    <div className={styles.topBarInner}>
                        <Link href="/" className={styles.logo}>
                            <span className={styles.logoGlitch} data-text="NEX">NEX</span>
                            <span className={styles.logoAccent}>GEAR</span>
                            <span className={styles.logoPulse} />
                        </Link>

                        <Link href="/search" className={styles.searchBar}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                            <span>Tìm kiếm sản phẩm...</span>
                        </Link>

                        <div className={styles.actions}>
                            <button className={styles.actionBtn} onClick={toggleTheme} aria-label="Toggle theme">
                                {theme === 'light' ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                                )}
                            </button>

                            <Link href="/compare" className={styles.actionBtn} aria-label="So sánh">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9" /><path d="M16.5 15.5L21 20l-4.5 4.5" /><path d="M12 4H3" /><path d="M7.5 8.5L3 4l4.5-4.5" /></svg>
                                {isMounted && compareCount > 0 && <span className={styles.badge}>{compareCount}</span>}
                            </Link>

                            <Link href="/wishlist" className={styles.actionBtn} aria-label="Yêu thích">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                            </Link>

                            <Link href="/cart" className={styles.actionBtn} aria-label="Giỏ hàng">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                                {isMounted && cartCount > 0 && <span className={styles.badge}>{cartCount > 99 ? '99+' : cartCount}</span>}
                            </Link>

                            {session ? (
                                <Link href="/account" className={styles.accountBtn}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></Link>
                            ) : (
                                <Link href="/login" className={styles.accountBtn}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg></Link>
                            )}

                            <button
                                className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
                                onClick={() => setMenuOpen(v => !v)}
                                aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
                                aria-expanded={menuOpen}
                            >
                                <span className={styles.hamLine} />
                                <span className={styles.hamLine} />
                                <span className={styles.hamLine} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── CATEGORY BAR ── */}
                <div className={styles.catBar}>
                    <div className={styles.catBarInner}>
                        <nav className={styles.catNav} aria-label="Danh mục">
                            {categories.map(cat => (
                                <div
                                    key={cat.href}
                                    className={styles.catWrap}
                                    onMouseEnter={() => cat.sub && handleMouseEnter(cat.href)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <Link
                                        href={cat.href}
                                        className={`${styles.catLink} ${pathname.startsWith(cat.href) ? styles.catLinkActive : ''}`}
                                    >
                                        {cat.label}
                                        {cat.sub && <span className={styles.catChevron}>▾</span>}
                                    </Link>

                                    {/* Mega Dropdown — always in DOM, toggled via CSS class */}
                                    {cat.sub && (
                                        <div
                                            className={`${styles.megaDropdown} ${activeDropdown === cat.href ? styles.megaDropdownOpen : ''}`}
                                            onMouseEnter={() => handleMouseEnter(cat.href)}
                                            onMouseLeave={handleMouseLeave}
                                        >
                                            <div className={styles.megaBar} />
                                            <div className={styles.megaContent}>
                                                <div className={styles.megaList}>
                                                    <div className={styles.megaListTitle}>{cat.label.toUpperCase()}</div>
                                                    {cat.sub.map((s, i) => (
                                                        <Link
                                                            key={s.href}
                                                            href={s.href}
                                                            className={styles.megaItem}
                                                            style={{ animationDelay: `${i * 35}ms` }}
                                                        >
                                                            <span className={styles.megaItemLabel}>{s.label}</span>
                                                            {s.desc && <span className={styles.megaItemDesc}>{s.desc}</span>}
                                                        </Link>
                                                    ))}
                                                    <Link href={cat.href} className={styles.megaViewAll}>
                                                        Xem tất cả {cat.label} →
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            <span className={styles.catSep} />

                            {/* Dịch vụ dropdown */}
                            <div
                                className={styles.catWrap}
                                onMouseEnter={() => handleMouseEnter(SERVICE_MENU.href + '-svc')}
                                onMouseLeave={handleMouseLeave}
                            >
                                <Link
                                    href={SERVICE_MENU.href}
                                    className={`${styles.catLink} ${pathname.startsWith('/sua-chua') || pathname.startsWith('/thu-cu') ? styles.catLinkActive : ''}`}
                                >
                                    {SERVICE_MENU.label}
                                    <span className={styles.catChevron}>▾</span>
                                </Link>
                                {SERVICE_MENU.sub && (
                                    <div
                                        className={`${styles.megaDropdown} ${activeDropdown === SERVICE_MENU.href + '-svc' ? styles.megaDropdownOpen : ''}`}
                                        onMouseEnter={() => handleMouseEnter(SERVICE_MENU.href + '-svc')}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        <div className={styles.megaBar} />
                                        <div className={styles.megaContent}>
                                            <div className={styles.megaList}>
                                                {SERVICE_MENU.sub.map((s, i) => (
                                                    <Link key={s.href} href={s.href} className={styles.megaItem} style={{ animationDelay: `${i * 35}ms` }}>
                                                        <span className={styles.megaItemLabel}>{s.label}</span>
                                                        {s.desc && <span className={styles.megaItemDesc}>{s.desc}</span>}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {MORE_LINKS.map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`${styles.catLink} ${link.highlight ? styles.catLinkDeal : ''} ${pathname.startsWith(link.href) ? styles.catLinkActive : ''}`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>

                <div className={styles.neonBorder} />
            </header>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className={styles.mobileOverlay} onClick={() => setMenuOpen(false)}>
                    <nav className={styles.mobileMenu} onClick={e => e.stopPropagation()} aria-label="Mobile navigation">
                        <div className={styles.mobileHeader}>
                            <span className={styles.mobileLogo}>
                                <span className={styles.logoGlitch} data-text="NEX">NEX</span>
                                <span className={styles.logoAccent}>GEAR</span>
                            </span>
                            <button className={styles.mobileClose} onClick={() => setMenuOpen(false)}>✕</button>
                        </div>
                        <div className={styles.mobileDivider} />

                        {categories.map(cat => (
                            <div key={cat.href} className={styles.mobileLinkGroup}>
                                <div className={styles.mobileLinkRow}>
                                    <Link href={cat.href} className={`${styles.mobileLink} ${pathname.startsWith(cat.href) ? styles.mobileLinkActive : ''}`}>
                                        {cat.label}
                                    </Link>
                                    {cat.sub && (
                                        <button
                                            className={`${styles.mobileExpand} ${mobileExpanded === cat.href ? styles.mobileExpandOpen : ''}`}
                                            onClick={() => setMobileExpanded(prev => prev === cat.href ? null : cat.href)}
                                        >▾</button>
                                    )}
                                </div>
                                {cat.sub && mobileExpanded === cat.href && (
                                    <div className={styles.mobileSub}>
                                        {cat.sub.map(s => (
                                            <Link key={s.href} href={s.href} className={styles.mobileSubLink}>
                                                <span className={styles.mobileSubDash}>//</span> {s.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        <div className={styles.mobileDivider} />
                        <Link href="/sua-chua-laptop" className={styles.mobileLink}>🔧 Sửa chữa Laptop</Link>
                        <Link href="/thu-cu-doi-moi" className={styles.mobileLink}>🔄 Thu cũ đổi mới</Link>
                        {MORE_LINKS.map(link => (
                            <Link key={link.href} href={link.href} className={`${styles.mobileLink} ${link.highlight ? styles.mobileLinkHighlight : ''}`}>
                                {link.label}
                            </Link>
                        ))}
                        <div className={styles.mobileDivider} />

                        {session ? (
                            <>
                                <Link href="/account" className={styles.mobileLink}>👤 {session.user?.name || 'Tài khoản'}</Link>
                                <button onClick={() => signOut()} className={`${styles.mobileLink} ${styles.mobileLinkBtn}`}>⏻ Đăng xuất</button>
                            </>
                        ) : (
                            <Link href="/login" className={styles.mobileLink}>⏻ Đăng nhập</Link>
                        )}
                        <Link href="/compare" className={styles.mobileLink}>⚖️ So sánh {isMounted && compareCount > 0 && `(${compareCount})`}</Link>
                        <Link href="/cart" className={styles.mobileLink}>🛒 Giỏ hàng {isMounted && cartCount > 0 && `(${cartCount})`}</Link>
                        <div className={styles.mobileNeon} />
                    </nav>
                </div>
            )}
        </>
    )
}
