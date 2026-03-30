'use client';

import styles from './Footer.module.scss'
import Link from 'next/link'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'

const Footer = () => {
    const siteSettings = useSiteSettings();

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.top}>
                    <div className={styles.brand}>
                        <Link href="/" className={styles.logo}>
                            {siteSettings.storeName}
                        </Link>
                        <p className={styles.tagline}>{siteSettings.siteTagline}</p>

                    </div>

                    <div className={styles.grid}>
                        <div className={styles.col}>
                            <h3>DANH MỤC</h3>
                            <ul>
                                <li><Link href="/ban-phim">Bàn Phím</Link></li>
                                <li><Link href="/chuot">Chuột & Lót</Link></li>
                                <li><Link href="/tai-nghe">Tai Nghe</Link></li>
                                <li><Link href="/loa">Loa & Mic</Link></li>
                                <li><Link href="/phu-kien">Phụ Kiện</Link></li>
                            </ul>
                        </div>
                        <div className={styles.col}>
                            <h3>HỖ TRỢ</h3>
                            <ul>
                                <li><Link href="/warranty">Bảo Hành</Link></li>
                                <li><Link href="/shipping">Vận Chuyển</Link></li>
                                <li><Link href="/returns">Đổi Trả</Link></li>
                                <li><Link href="/contact">Liên Hệ</Link></li>
                                <li><Link href="/test-laptop">Công cụ Test Laptop</Link></li>
                            </ul>
                        </div>
                        <div className={styles.col}>
                            <h3>VỀ CHÚNG TÔI</h3>
                            <ul>
                                <li><Link href="/about">Câu Chuyện</Link></li>
                                <li><Link href="/stores">Cửa Hàng</Link></li>
                                <li><Link href="/careers">Tuyển Dụng</Link></li>
                            </ul>
                        </div>
                        <div className={styles.col}>
                            <h3>HỆ SINH THÁI</h3>
                            <ul>
                                <li><a href={siteSettings.siteDomain} target="_blank" rel="noopener">{siteSettings.storeName} Store</a></li>
                                <li><a href={siteSettings.siteDomain} target="_blank" rel="noopener">{siteSettings.storeName}</a></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* <div className={styles.bottom}>
                    <div className={styles.chips}>
                        <span className={styles.chip}>Next.js 15</span>
                        <span className={styles.chip}>MongoDB Atlas</span>
                        <span className={styles.chip}>Tailwind v4</span>
                        <span className={styles.chip}>shadcn/ui</span>
                        <span className={styles.chip}>VNPay</span>
                        <span className={styles.chip}>TypeScript</span>
                    </div>
                    <p className={styles.copyright}>
                        © {new Date().getFullYear()} NEXGEAR. All rights reserved.
                    </p>
                </div> */}
            </div>
        </footer>
    )
}

export default Footer
