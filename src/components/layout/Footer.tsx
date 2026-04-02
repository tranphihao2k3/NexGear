'use client';

import styles from './Footer.module.scss'
import Link from 'next/link'
import Image from 'next/image'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'

const Footer = () => {
    const s = useSiteSettings();
    const year = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            {/* ── GRADIENT TOP BORDER ── */}
            <div className={styles.topBar} />

            <div className={styles.container}>

                {/* ════════ MAIN CONTENT ════════ */}
                <div className={styles.main}>

                    {/* ── CỘT 1: BRAND + THÔNG TIN + MAP ── */}
                    <div className={styles.brand}>
                        <Link href="/" className={styles.logo}>
                            {s.logoUrl ? (
                                <Image
                                    src={s.logoUrl}
                                    alt={s.storeName}
                                    width={200}
                                    height={72}
                                    style={{ objectFit: 'contain', maxHeight: '72px', width: 'auto', maxWidth: '220px' }}
                                />
                            ) : (
                                s.storeName
                            )}
                        </Link>
                        <p className={styles.tagline}>{s.siteTagline}</p>

                        <div className={styles.contactList}>
                            {s.storeAddress && (
                                <div className={`${styles.contactItem} ${styles.hideOnMobile}`}>
                                    <span className={styles.contactIcon}>📍</span>
                                    <span>{s.storeAddress}</span>
                                </div>
                            )}
                            {s.storePhone && (
                                <div className={styles.contactItem}>
                                    <span className={styles.contactIcon}>📞</span>
                                    <a href={`tel:${s.storePhone.replace(/\s/g, '')}`}
                                        className={styles.contactLink}>{s.storePhone}</a>
                                </div>
                            )}
                            {s.storeEmail && (
                                <div className={`${styles.contactItem} ${styles.hideOnMobile}`}>
                                    <span className={styles.contactIcon}>✉️</span>
                                    <a href={`mailto:${s.storeEmail}`}
                                        className={styles.contactLink}>{s.storeEmail}</a>
                                </div>
                            )}
                            {s.taxCode && (
                                <div className={styles.contactItem}>
                                    <span className={styles.contactIcon}>🏢</span>
                                    <span>MST: {s.taxCode}</span>
                                </div>
                            )}
                        </div>

                        {/* Google Maps embed */}
                        {s.googleMapsEmbedUrl && (
                            <div className={styles.mapWrapper}>
                                <iframe
                                    src={s.googleMapsEmbedUrl}
                                    width="100%"
                                    height="160"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title={`Bản đồ ${s.storeName}`}
                                />
                            </div>
                        )}

                        {/* Social links */}
                        <div className={styles.socials}>
                            {s.facebook && (
                                <a href={s.facebook} target="_blank" rel="noopener noreferrer"
                                    className={styles.socialBtn} aria-label="Facebook">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                                    </svg>
                                </a>
                            )}
                            {s.instagram && (
                                <a href={s.instagram} target="_blank" rel="noopener noreferrer"
                                    className={styles.socialBtn} aria-label="Instagram">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                        <circle cx="12" cy="12" r="4" />
                                        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                                    </svg>
                                </a>
                            )}
                            {s.tiktok && (
                                <a href={s.tiktok} target="_blank" rel="noopener noreferrer"
                                    className={styles.socialBtn} aria-label="TikTok">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.5a8.17 8.17 0 0 0 4.78 1.52V6.57a4.85 4.85 0 0 1-1.01.12z" />
                                    </svg>
                                </a>
                            )}
                        </div>
                    </div>

                    {/* ── LINKS GRID ── */}
                    <div className={styles.linksGrid}>

                        {/* Danh mục */}
                        <nav className={styles.navCol}>
                            <h4 className={styles.colTitle}>DANH MỤC</h4>
                            <ul>
                                <li><Link href="/ban-phim">Bàn Phím Cơ</Link></li>
                                <li><Link href="/chuot">Chuột Gaming</Link></li>
                                <li><Link href="/tai-nghe">Tai Nghe</Link></li>
                                <li><Link href="/loa">Loa &amp; Mic</Link></li>
                                <li><Link href="/phu-kien">Phụ Kiện</Link></li>
                            </ul>
                        </nav>

                        {/* Chính sách */}
                        <nav className={styles.navCol}>
                            <h4 className={styles.colTitle}>CHÍNH SÁCH &amp; QUY ĐỊNH</h4>
                            <ul>
                                <li><Link href="/warranty-policy">Chính sách bảo hành</Link></li>
                                <li><Link href="/return-policy">Chính sách đổi trả hàng</Link></li>
                                <li><Link href="/purchase-policy">Chính sách mua hàng</Link></li>
                                <li><Link href="/kiem-hang">Chính sách kiểm hàng</Link></li>
                                <li><Link href="/privacy-policy">Chính sách bảo mật</Link></li>
                                <li><Link href="/payment-policy">Chính sách thanh toán</Link></li>
                                <li><Link href="/shipping-policy">Chính sách vận chuyển</Link></li>
                                <li><Link href="/terms-of-service">Điều khoản sử dụng</Link></li>
                            </ul>
                        </nav>

                        {/* Hỗ trợ */}
                        <nav className={styles.navCol}>
                            <h4 className={styles.colTitle}>HỖ TRỢ</h4>
                            <ul>
                                <li><Link href="/about">Câu Chuyện</Link></li>
                                <li><Link href="/contact">Liên Hệ</Link></li>
                                <li><Link href="/test-laptop">Test Laptop</Link></li>
                                {s.storePhone && (
                                    <li>
                                        <a href={`tel:${s.storePhone.replace(/\s/g, '')}`}
                                            className={styles.hotlineBtn}>
                                            📞 {s.storePhone}
                                        </a>
                                    </li>
                                )}
                            </ul>
                        </nav>

                        {/* Fanpage Facebook (nếu có) */}
                        {s.facebookPageId && (
                            <div className={styles.navCol}>
                                <h4 className={styles.colTitle}>FANPAGE</h4>
                                <div className={styles.fbEmbed}>
                                    <iframe
                                        src={`https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2F${encodeURIComponent(s.facebookPageId)}&tabs&width=240&height=150&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true`}
                                        width="240"
                                        height="150"
                                        style={{ border: 'none', overflow: 'hidden' }}
                                        scrolling="no"
                                        frameBorder={0}
                                        allowFullScreen
                                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                                        title="Facebook fanpage"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ════════ PAYMENT METHODS ════════ */}
                <div className={styles.paymentSection}>
                    <div className={styles.paymentLabel}>PHƯƠNG THỨC THANH TOÁN</div>
                    <div className={styles.paymentMethods}>
                        <div className={styles.payChip}>
                            <span className={styles.payIcon}>💵</span>
                            <span>Tiền mặt</span>
                        </div>
                        <div className={styles.payChip}>
                            <span className={styles.payIcon}>🏦</span>
                            <span>Chuyển khoản</span>
                        </div>
                        <div className={styles.payChip}>
                            <span className={styles.payIcon}>🚚</span>
                            <span>COD</span>
                        </div>
                    </div>
                    <p className={styles.payDesc}>
                        Thanh toán tiền mặt, chuyển khoản ngân hàng hoặc COD — Giao dịch nhanh &amp; bảo mật
                    </p>
                </div>

                {/* ════════ BOTTOM BAR ════════ */}
                <div className={styles.bottomBar}>
                    <p className={styles.copyright}>
                        © {year} <strong>{s.storeName}</strong>. All rights reserved.
                        {s.taxCode && <span style={{ marginLeft: '0.5rem', opacity: 0.6 }}>MST: {s.taxCode}</span>}
                    </p>
                    <div className={styles.bottomLinks}>
                        <Link href="/privacy-policy">Bảo mật</Link>
                        <span className={styles.dot}>·</span>
                        <Link href="/terms-of-service">Điều khoản</Link>
                        <span className={styles.dot}>·</span>
                        <Link href="/purchase-policy">Mua hàng</Link>
                        <span className={styles.dot}>·</span>
                        <Link href="/contact">Liên hệ</Link>
                    </div>
                    {/* BCT Badge — điền link sau khi đăng ký tại online.gov.vn */}
                    <a
                        href="http://online.gov.vn"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Đã thông báo với Bộ Công Thương"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', opacity: 0.7 }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/bct-badge.png"
                            alt="Đã đăng ký với Bộ Công Thương"
                            width={120}
                            height={40}
                            style={{ objectFit: 'contain' }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                    </a>
                </div>
            </div>
        </footer>
    )
}

export default Footer
