// ============================================================
// NEXGEAR — Navbar Component (Clean + Mega Menu)
// ============================================================
'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from '@/contexts/ThemeContext'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import { useCategories } from '@/contexts/CategoriesContext'
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

const MORE_LINKS: { href: string; label: string; highlight?: boolean; testLink?: boolean }[] = [
    { href: '/blog', label: 'Blog' },
    { href: '/deals', label: 'Flash Deal', highlight: true },
    { href: '/test-laptop', label: '🧪 Test Laptop', testLink: true },
]

interface NavbarProps {
    cartCount?: number
}

export default function Navbar({ cartCount = 0 }: NavbarProps) {
    const siteSettings = useSiteSettings()
    const { data: session } = useSession()
    const pathname = usePathname()
    const router = useRouter()
    const { theme, toggleTheme } = useTheme()
    const [menuOpen, setMenuOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [scrolled, setScrolled] = useState(false)
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
    const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)
    const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

    const compareCount = useCompareStore(state => state.items.length)
    const [isMounted, setIsMounted] = useState(false)
    const [logoImgError, setLogoImgError] = useState(false)

    // Categories from server context — no client-side fetch needed
    const serverCategories = useCategories();
    const categories = useMemo<NavLink[]>(() => {
        if (serverCategories.length === 0) {
            // Fallback defaults if context is empty
            return [
                { href: '/laptop', label: 'Laptop', sub: [
                    { href: '/gaming-laptop', label: 'Gaming Laptop', desc: 'Laptop hiệu năng cao cho game' },
                    { href: '/ultrabook', label: 'Ultrabook', desc: 'Mỏng nhẹ, thời trang' },
                    { href: '/workstation', label: 'Workstation', desc: 'Đồ họa, lập trình chuyên nghiệp' },
                    { href: '/laptop-sinh-vien', label: 'Laptop Sinh Viên', desc: 'Giá tốt, phù hợp học tập' },
                ]},
            ];
        }

        const mapped = serverCategories.map((cat) => {
            const baseSub = cat.children?.length
                ? cat.children.map(ch => ({
                    href: `/${ch.slug}`,
                    label: ch.name,
                    desc: ch.description || ''
                  }))
                : undefined;

            if (cat.slug === 'laptop' || cat.name.toLowerCase() === 'laptop') {
                const defaults = [
                    { href: '/gaming-laptop', label: 'Gaming Laptop', desc: 'Laptop hiệu năng cao cho game' },
                    { href: '/ultrabook', label: 'Ultrabook', desc: 'Mỏng nhẹ, thời trang' },
                    { href: '/workstation', label: 'Workstation', desc: 'Đồ họa, lập trình chuyên nghiệp' },
                    { href: '/laptop-sinh-vien', label: 'Laptop Sinh Viên', desc: 'Giá tốt, phù hợp học tập' },
                ];
                const currentLabels = new Set((baseSub || []).map(s => s.label.toLowerCase()));
                const mergedSub = [...(baseSub || [])];
                for (const defItem of defaults) {
                    if (!currentLabels.has(defItem.label.toLowerCase())) {
                        mergedSub.push(defItem);
                    }
                }
                return { href: `/${cat.slug}`, label: cat.name, sub: mergedSub };
            }

            return { href: `/${cat.slug}`, label: cat.name, sub: baseSub };
        });

        if (!mapped.some(c => c.label.toLowerCase() === 'laptop')) {
            mapped.unshift({
                href: '/laptop', label: 'Laptop', sub: [
                    { href: '/gaming-laptop', label: 'Gaming Laptop', desc: 'Laptop hiệu năng cao cho game' },
                    { href: '/ultrabook', label: 'Ultrabook', desc: 'Mỏng nhẹ, thời trang' },
                    { href: '/workstation', label: 'Workstation', desc: 'Đồ họa, lập trình chuyên nghiệp' },
                    { href: '/laptop-sinh-vien', label: 'Laptop Sinh Viên', desc: 'Giá tốt, phù hợp học tập' },
                ]
            });
        }

        return mapped;
    }, [serverCategories]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => { setMenuOpen(false) }, [pathname])
    // Reset logo error khi logoUrl thay đổi
    useEffect(() => { setLogoImgError(false) }, [siteSettings.logoUrl])

    function handleMouseEnter(href: string) {
        if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current)
        setActiveDropdown(href)
    }

    function handleMouseLeave() {
        dropdownTimeout.current = setTimeout(() => setActiveDropdown(null), 200)
    }

    const isVietnamese = /[àáãạảăắằẳẵặâấầẩẫậèéẹẻẽêềếểễệđìíĩỉịòóõọỏôốồổỗộơớờởỡợùúũụủưứừửữựỳýỵỷỹ]/i.test(siteSettings.storeName);
    let namePart1: string;
    let namePart2: string;
    if (isVietnamese) {
        const lastSpace = siteSettings.storeName.lastIndexOf(' ');
        namePart1 = lastSpace > 0 ? siteSettings.storeName.substring(0, lastSpace) + ' ' : siteSettings.storeName;
        namePart2 = lastSpace > 0 ? siteSettings.storeName.substring(lastSpace + 1) : '';
    } else {
        const name = siteSettings.storeName;
        const accentLen = name.length > 6 ? 4 : Math.floor(name.length / 2);
        namePart1 = name.substring(0, name.length - accentLen);
        namePart2 = name.substring(name.length - accentLen);
    }


    return (
        <>
            <header className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
                <div className={styles.scanLines} aria-hidden="true" />

                {/* ── TOP BAR ── */}
                <div className={styles.topBar}>
                    <div className={styles.topBarInner}>
                        <Link href="/" className={styles.logo}>
                            {siteSettings.logoUrl && !logoImgError ? (
                                // ── Image logo ──
                                <Image
                                    src={siteSettings.logoUrl}
                                    alt={siteSettings.storeName}
                                    width={200}
                                    height={56}
                                    style={{ objectFit: 'contain', height: '52px', width: 'auto', maxWidth: '220px' }}
                                    priority
                                    onError={() => setLogoImgError(true)}
                                />
                            ) : (
                                // ── Text logo fallback (mặc định hoặc khi ảnh lỗi) ──
                                <>
                                    <span className={styles.logoGlitch}>{namePart1}</span>
                                    <span className={styles.logoAccent}>{namePart2}</span>
                                </>
                            )}
                        </Link>

                        <form
                            className={styles.searchBar}
                            onSubmit={(e) => {
                                e.preventDefault()
                                const q = searchQuery.trim()
                                if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Tìm kiếm sản phẩm..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </form>

                        <div className={styles.actions}>
                            <button className={styles.actionBtn} onClick={toggleTheme} aria-label="Toggle theme">
                                {theme === 'light' ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                                )}
                            </button>

                            <Link href="/warranty-policy" className={styles.actionBtn} aria-label="Tra cứu bảo hành" title="Tra cứu bảo hành">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </Link>

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
                            {(siteSettings.headerMenu || []).map(item => {
                                let subItems = item.children;
                                if (item.isMegaMenu) {
                                    const matchingCategory = categories.find(c => c.href === item.href || item.href.endsWith(c.href));
                                    if (matchingCategory) {
                                        subItems = matchingCategory.sub as any;
                                    }
                                }

                                const hasSub = subItems && subItems.length > 0;
                                const dropdownKey = `${item.href}-${item.id}`;

                                return (
                                    <div
                                        key={item.id}
                                        className={styles.catWrap}
                                        onMouseEnter={() => hasSub && handleMouseEnter(dropdownKey)}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        <Link
                                            href={item.href}
                                            prefetch={false}
                                            className={`${styles.catLink} ${item.highlight ? styles.catLinkDeal : ''} ${pathname === item.href || pathname.startsWith(item.href + '/') ? styles.catLinkActive : ''}`}
                                        >
                                            {item.label}
                                            {hasSub && <span className={styles.catChevron}>▾</span>}
                                        </Link>

                                        {hasSub && (
                                            <div
                                                className={`${styles.megaDropdown} ${activeDropdown === dropdownKey ? styles.megaDropdownOpen : ''}`}
                                                onMouseEnter={() => handleMouseEnter(dropdownKey)}
                                                onMouseLeave={handleMouseLeave}
                                            >
                                                <div className={styles.megaBar} />
                                                <div className={styles.megaContent}>
                                                    <div className={styles.megaList}>
                                                        <div className={styles.megaListTitle}>{item.label.toUpperCase()}</div>
                                                        {(subItems || []).map((s, i) => (
                                                            <Link
                                                                key={s.href + '-' + i}
                                                                href={s.href}
                                                                prefetch={false}
                                                                className={styles.megaItem}
                                                                style={{ animationDelay: `${i * 35}ms` }}
                                                            >
                                                                <span className={styles.megaItemLabel}>{s.label}</span>
                                                                {s.desc && <span className={styles.megaItemDesc}>{s.desc}</span>}
                                                            </Link>
                                                        ))}
                                                        <Link href={item.href} prefetch={false} className={styles.megaViewAll}>
                                                            Xem tất cả {item.label} →
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
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
                                <span className={styles.logoGlitch}>{namePart1}</span>
                                <span className={styles.logoAccent}>{namePart2}</span>
                            </span>
                            <button className={styles.mobileClose} onClick={() => setMenuOpen(false)}>✕</button>
                        </div>
                        <div className={styles.mobileDivider} />

                        {(siteSettings.headerMenu || []).map(item => {
                            let subItems = item.children;
                            if (item.isMegaMenu) {
                                const matchingCategory = categories.find(c => c.href === item.href || item.href.endsWith(c.href));
                                if (matchingCategory) {
                                    subItems = matchingCategory.sub as any;
                                }
                            }

                            const hasSub = subItems && subItems.length > 0;

                            return (
                                <div key={item.id} className={styles.mobileLinkGroup}>
                                    <div className={styles.mobileLinkRow}>
                                        <Link href={item.href} className={`${styles.mobileLink} ${pathname === item.href ? styles.mobileLinkActive : ''}`}>
                                            {item.label}
                                        </Link>
                                        {hasSub && (
                                            <button
                                                className={`${styles.mobileExpand} ${mobileExpanded === item.id ? styles.mobileExpandOpen : ''}`}
                                                onClick={() => setMobileExpanded(prev => prev === item.id ? null : item.id)}
                                            >▾</button>
                                        )}
                                    </div>
                                    {hasSub && mobileExpanded === item.id && (
                                        <div className={styles.mobileSub}>
                                            {(subItems || []).map((s, i) => (
                                                <Link key={s.href + '-' + i} href={s.href} className={styles.mobileSubLink}>
                                                    <span className={styles.mobileSubDash}>//</span> {s.label}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        <div className={styles.mobileDivider} />

                        {session ? (
                            <>
                                <Link href="/account" className={styles.mobileLink}>👤 {session.user?.name || 'Tài khoản'}</Link>
                                <button onClick={() => signOut()} className={`${styles.mobileLink} ${styles.mobileLinkBtn}`}>⏻ Đăng xuất</button>
                            </>
                        ) : (
                            <Link href="/login" className={styles.mobileLink}>⏻ Đăng nhập</Link>
                        )}
                        <Link href="/warranty-policy" className={styles.mobileLink}>🛡️ Tra cứu bảo hành</Link>
                        <Link href="/compare" className={styles.mobileLink}>⚖️ So sánh {isMounted && compareCount > 0 && `(${compareCount})`}</Link>
                        <Link href="/cart" className={styles.mobileLink}>🛒 Giỏ hàng {isMounted && cartCount > 0 && `(${cartCount})`}</Link>
                        <div className={styles.mobileNeon} />
                    </nav>
                </div>
            )}
        </>
    )
}
