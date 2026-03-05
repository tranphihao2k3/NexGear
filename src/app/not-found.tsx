"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import styles from "./not-found.module.scss";

export default function NotFound() {
    return (
        <div className={styles.page}>
            {/* Animated grid */}
            <div className={styles.gridBg} aria-hidden="true">
                {Array.from({ length: 64 }).map((_, i) => (
                    <span key={i} className={styles.gridCell} style={{ animationDelay: `${(i % 8) * 0.1}s` }} />
                ))}
            </div>

            <div className={styles.content}>
                {/* Big 404 */}
                <div className={styles.errorNum} aria-hidden="true">
                    <span className={styles.digit}>4</span>
                    <span className={styles.digitO}>0</span>
                    <span className={styles.digit}>4</span>
                </div>

                <div className={styles.glitchWrap}>
                    <h1 className={styles.title} data-text="TRANG KHÔNG TỒN TẠI">
                        TRANG KHÔNG TỒN TẠI
                    </h1>
                </div>

                <p className={styles.subtitle}>
                    Trang bạn đang tìm không tồn tại hoặc đã bị di chuyển.<br />
                    Hãy quay lại trang chủ hoặc tìm kiếm sản phẩm.
                </p>

                {/* Quick links */}
                <div className={styles.quickLinks}>
                    <span className={styles.quickLabel}>Danh mục phổ biến:</span>
                    {[
                        { href: "/ban-phim", label: "⌨ Bàn Phím" },
                        { href: "/chuot", label: "🖱 Chuột" },
                        { href: "/tai-nghe", label: "🎧 Tai Nghe" },
                    ].map(l => (
                        <Link key={l.href} href={l.href} className={styles.quickLink}>
                            {l.label}
                        </Link>
                    ))}
                </div>

                <div className={styles.actions}>
                    <Button variant="cyan" size="xl" href="/">
                        VỀ TRANG CHỦ →
                    </Button>
                    <Button variant="outline" size="xl" href="/ban-phim">
                        XEM SẢN PHẨM
                    </Button>
                </div>

                {/* Error code */}
                <div className={styles.code}>ERROR_CODE: 404_NOT_FOUND</div>
            </div>
        </div>
    );
}
