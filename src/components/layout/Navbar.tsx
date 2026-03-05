// ============================================================
// NEXGEAR — Navbar Component (Cyberpunk Light)
// ============================================================
'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from '@/contexts/ThemeContext'
import styles from './Navbar.module.scss'

const NAV_LINKS = [
    {
        href: '/ban-phim', label: 'Ban phim', vn: 'Bàn phím', icon: '⌨',
        sub: [
            { href: '/ban-phim?type=co', label: 'Bàn phím cơ' },
            { href: '/ban-phim?type=khong-day', label: 'Không dây' },
            { href: '/ban-phim?layout=tkl', label: 'TKL / 75%' },
            { href: '/ban-phim?layout=60', label: '60% / 65%' },
        ],
    },
    {
        href: '/chuot', label: 'Chuot', vn: 'Chuột', icon: '🖱',
        sub: [
            { href: '/chuot?type=gaming', label: 'Gaming Mouse' },
            { href: '/chuot?type=wireless', label: 'Wireless' },
            { href: '/chuot?type=ergonomic', label: 'Ergonomic' },
        ],
    },
    {
        href: '/tai-nghe', label: 'Tai nghe', vn: 'Tai nghe', icon: '🎧',
        sub: [
            { href: '/tai-nghe?type=over-ear', label: 'Over-ear' },
            { href: '/tai-nghe?type=in-ear', label: 'In-ear / TWS' },
            { href: '/tai-nghe?type=gaming', label: 'Gaming Headset' },
        ],
    },
    {
        href: '/loa', label: 'Loa', vn: 'Loa', icon: '🔊',
        sub: [
            { href: '/loa?type=soundbar', label: 'Soundbar' },
            { href: '/loa?type=bluetooth', label: 'Bluetooth' },
            { href: '/loa?type=desktop', label: 'Desktop Speaker' },
        ],
    },
    {
        href: '/phu-kien', label: 'Phu kien', vn: 'Phụ kiện', icon: '🔧',
        sub: [
            { href: '/phu-kien?type=keycap', label: 'Keycap Sets' },
            { href: '/phu-kien?type=switch', label: 'Switches' },
            { href: '/phu-kien?type=pad', label: 'Mouse Pad' },
            { href: '/phu-kien?type=cable', label: 'Cable & Hub' },
            { href: '/phu-kien?type=wrist-rest', label: 'Wrist Rest' },
        ],
    },
    {
        href: '/deals', label: 'Deals', vn: 'Flash Deal', icon: '⚡', highlight: true,
    },
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

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 8)
        window.addEventListener('scroll', handler, { passive: true })
        return () => window.removeEventListener('scroll', handler)
    }, [])

    useEffect(() => { setMenuOpen(false) }, [pathname])

    function handleMouseEnter(href: string) {
        if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current)
        setActiveDropdown(href)
    }

    function handleMouseLeave() {
        dropdownTimeout.current = setTimeout(() => setActiveDropdown(null), 150)
    }

    return (
        <>
            <header className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
                {/* Scan line overlay */}
                <div className={styles.scanLines} aria-hidden="true" />

                <div className={styles.inner}>
                    {/* Logo */}
                    <Link href="/" className={styles.logo}>
                        <span className={styles.logoGlitch} data-text="NEX">NEX</span>
                        <span className={styles.logoAccent}>GEAR</span>
                        <span className={styles.logoPulse} />
                    </Link>

                    {/* Desktop nav links */}
                    <nav className={styles.links} aria-label="Main navigation">
                        {NAV_LINKS.map(link => (
                            <div
                                key={link.href}
                                className={styles.linkWrap}
                                onMouseEnter={() => link.sub && handleMouseEnter(link.href)}
                                onMouseLeave={handleMouseLeave}
                            >
                                <Link
                                    href={link.href}
                                    className={[
                                        styles.link,
                                        pathname.startsWith(link.href) ? styles.linkActive : '',
                                        link.highlight ? styles.linkHighlight : '',
                                    ].join(' ')}
                                >
                                    <span className={styles.linkLabel}>{link.vn}</span>
                                    {link.sub && <span className={styles.linkChevron}>▾</span>}
                                    <span className={styles.linkGlow} />
                                </Link>

                                {/* Dropdown */}
                                {link.sub && activeDropdown === link.href && (
                                    <div className={styles.dropdown}>
                                        <div className={styles.dropdownBar} />
                                        {link.sub.map((s, i) => (
                                            <Link
                                                key={s.href}
                                                href={s.href}
                                                className={styles.dropdownItem}
                                                style={{ animationDelay: `${i * 40}ms` }}
                                            >
                                                <span className={styles.dropdownDash}>&#x2F;&#x2F;</span>
                                                {s.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className={styles.actions}>
                        <button
                            className={styles.actionBtn}
                            onClick={toggleTheme}
                            aria-label={theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'}
                        >
                            {theme === 'light' ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                            )}
                        </button>

                        <Link href="/search" className={styles.actionBtn} aria-label="Tìm kiếm">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                        </Link>

                        <Link href="/wishlist" className={styles.actionBtn} aria-label="Yêu thích">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        </Link>

                        <Link href="/cart" className={styles.actionBtn} aria-label={`Giỏ hàng (${cartCount})`}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                            {cartCount > 0 && (
                                <span className={styles.cartBadge}>
                                    {cartCount > 99 ? '99+' : cartCount}
                                </span>
                            )}
                        </Link>

                        {session ? (
                            <Link href="/account" className={styles.ctaBtn}>
                                <span className={styles.ctaGlitch} data-text="TÀI KHOẢN">TÀI KHOẢN</span>
                            </Link>
                        ) : (
                            <Link href="/login" className={styles.ctaBtn}>
                                <span className={styles.ctaGlitch} data-text="ĐĂNG NHẬP">ĐĂNG NHẬP</span>
                            </Link>
                        )}

                        {/* Mobile hamburger */}
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

                {/* Bottom neon line */}
                <div className={styles.neonBorder} />
            </header>

            {/* Mobile Menu Overlay */}
            {menuOpen && (
                <div className={styles.mobileOverlay} onClick={() => setMenuOpen(false)}>
                    <nav
                        className={styles.mobileMenu}
                        onClick={e => e.stopPropagation()}
                        aria-label="Mobile navigation"
                    >
                        <div className={styles.mobileHeader}>
                            <span className={styles.mobileLogo}>
                                <span className={styles.logoGlitch} data-text="NEX">NEX</span>
                                <span className={styles.logoAccent}>GEAR</span>
                            </span>
                            <button className={styles.mobileClose} onClick={() => setMenuOpen(false)}>✕</button>
                        </div>

                        <div className={styles.mobileDivider} />

                        {NAV_LINKS.map(link => (
                            <div key={link.href} className={styles.mobileLinkGroup}>
                                <div className={styles.mobileLinkRow}>
                                    <Link
                                        href={link.href}
                                        className={[
                                            styles.mobileLink,
                                            pathname.startsWith(link.href) ? styles.mobileLinkActive : '',
                                            link.highlight ? styles.mobileLinkHighlight : '',
                                        ].join(' ')}
                                    >
                                        <span className={styles.mobileLinkIcon}>{link.icon}</span>
                                        {link.vn}
                                    </Link>
                                    {link.sub && (
                                        <button
                                            className={`${styles.mobileExpand} ${mobileExpanded === link.href ? styles.mobileExpandOpen : ''}`}
                                            onClick={() => setMobileExpanded(prev => prev === link.href ? null : link.href)}
                                        >
                                            ▾
                                        </button>
                                    )}
                                </div>
                                {link.sub && mobileExpanded === link.href && (
                                    <div className={styles.mobileSub}>
                                        {link.sub.map(s => (
                                            <Link key={s.href} href={s.href} className={styles.mobileSubLink}>
                                                <span className={styles.mobileSubDash}>//</span> {s.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        <div className={styles.mobileDivider} />

                        {session ? (
                            <>
                                <Link href="/account" className={styles.mobileLink}>
                                    <span className={styles.mobileLinkIcon}>👤</span>
                                    {session.user?.name || 'Tài khoản'}
                                </Link>
                                <button
                                    onClick={() => signOut()}
                                    className={`${styles.mobileLink} ${styles.mobileLinkBtn}`}
                                >
                                    <span className={styles.mobileLinkIcon}>⏻</span>
                                    Đăng xuất
                                </button>
                            </>
                        ) : (
                            <Link href="/login" className={styles.mobileLink}>
                                <span className={styles.mobileLinkIcon}>⏻</span>
                                Đăng nhập
                            </Link>
                        )}
                        <Link href="/cart" className={styles.mobileLink}>
                            <span className={styles.mobileLinkIcon}>🛒</span>
                            Giỏ hàng {cartCount > 0 && `(${cartCount})`}
                        </Link>

                        {/* Bottom neon accent */}
                        <div className={styles.mobileNeon} />
                    </nav>
                </div>
            )}
        </>
    )
}
