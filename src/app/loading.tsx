import styles from './not-found.module.scss'

export default function Loading() {
    return (
        <div className={styles.page} style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    fontSize: '48px',
                    fontWeight: 900,
                    fontFamily: 'var(--font-display)',
                    color: 'var(--color-primary, #00C4AD)',
                    animation: 'pulse 1.5s ease-in-out infinite',
                }}>
                    NEXGEAR
                </div>
                <p style={{
                    marginTop: '16px',
                    fontSize: '13px',
                    color: '#7A7870',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                }}>
                    Đang tải...
                </p>
            </div>
        </div>
    )
}
