'use client'

import Button from '@/components/ui/Button'
import styles from './not-found.module.scss'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <div className={styles.page}>
            <div className={styles.gridBg} aria-hidden="true">
                {Array.from({ length: 64 }).map((_, i) => (
                    <span key={i} className={styles.gridCell} style={{ animationDelay: `${(i % 8) * 0.1}s` }} />
                ))}
            </div>

            <div className={styles.content}>
                <div className={styles.errorNum} aria-hidden="true">
                    <span className={styles.digit}>5</span>
                    <span className={styles.digitO}>0</span>
                    <span className={styles.digit}>0</span>
                </div>

                <div className={styles.glitchWrap}>
                    <h1 className={styles.title} data-text="ĐÃ XẢY RA LỖI">
                        ĐÃ XẢY RA LỖI
                    </h1>
                </div>

                <p className={styles.subtitle}>
                    Có lỗi xảy ra khi tải trang này.<br />
                    Vui lòng thử lại hoặc quay về trang chủ.
                </p>

                <div className={styles.actions}>
                    <Button variant="cyan" size="xl" onClick={() => reset()}>
                        THỬ LẠI →
                    </Button>
                    <Button variant="outline" size="xl" href="/">
                        VỀ TRANG CHỦ
                    </Button>
                </div>

                <div className={styles.code}>ERROR_CODE: 500_INTERNAL</div>
            </div>
        </div>
    )
}
