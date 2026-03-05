// ============================================================
// NEXGEAR — Skeleton Loading Component
// File: components/ui/Skeleton.tsx
// ============================================================
import styles from './Skeleton.module.scss'

interface SkeletonProps {
    width?: string | number
    height?: string | number
    rounded?: boolean
    className?: string
}

export function Skeleton({ width, height = 16, rounded = false, className = '' }: SkeletonProps) {
    return (
        <span
            className={`${styles.skeleton} ${rounded ? styles['skeleton--rounded'] : ''} ${className}`}
            style={{ width, height }}
            aria-hidden
        />
    )
}

// ── Product Card Skeleton ────────────────────────────────────
export function ProductCardSkeleton() {
    return (
        <div className={styles.card}>
            <Skeleton height={180} className={styles.image} />
            <div className={styles.body}>
                <Skeleton width="40%" height={10} />
                <Skeleton width="90%" height={14} className={styles.mt2} />
                <Skeleton width="70%" height={14} className={styles.mt1} />
                <Skeleton width="50%" height={10} className={styles.mt2} />
                <Skeleton width="60%" height={20} className={styles.mt3} />
                <Skeleton height={34} className={styles.mt3} />
            </div>
        </div>
    )
}

// ── Product Grid Skeleton ────────────────────────────────────
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className={styles.grid}>
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    )
}