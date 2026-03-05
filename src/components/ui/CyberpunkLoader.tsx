import styles from './CyberpunkLoader.module.scss'

type CyberpunkLoaderProps = {
  message?: string
  compact?: boolean
  className?: string
}

export default function CyberpunkLoader({
  message = 'Đang tải dữ liệu...',
  compact = false,
  className = '',
}: CyberpunkLoaderProps) {
  return (
    <div className={`${styles.wrapper} ${compact ? styles.compact : ''} ${className}`.trim()}>
      <div className={styles.rings} aria-hidden="true">
        <span className={`${styles.ring} ${styles.ringA}`} />
        <span className={`${styles.ring} ${styles.ringB}`} />
        <span className={styles.core} />
      </div>
      <span className={styles.label}>{message}</span>
    </div>
  )
}
