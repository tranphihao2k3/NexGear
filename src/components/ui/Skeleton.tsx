// ============================================================
// LTV — Skeleton Loading Components
// File: components/ui/Skeleton.tsx
// Premium cyberpunk shimmer & neon scan design system
// ============================================================
import styles from './Skeleton.module.scss'

// ── Base block ───────────────────────────────────────────────
interface SkeletonProps {
    width?: string | number
    height?: string | number
    rounded?: boolean
    className?: string
    delay?: number
}

export function Skeleton({ width, height = 16, rounded = false, className = '', delay }: SkeletonProps) {
    return (
        <span
            className={`${styles.skeleton} ${rounded ? styles['skeleton--rounded'] : ''} ${className}`}
            style={{ width, height, animationDelay: delay ? `${delay}s` : undefined }}
            aria-hidden
        />
    )
}

// ── Product Card Skeleton ────────────────────────────────────
export function ProductCardSkeleton({ delay = 0 }: { delay?: number }) {
    return (
        <div className={styles.card} style={{ animationDelay: `${delay}s` }}>
            {/* Image area with neon scan line */}
            <div className={styles.image} style={{ animationDelay: `${delay}s` }} />
            {/* Body */}
            <div className={styles.body}>
                {/* Brand label */}
                <Skeleton width="38%" height={10} delay={delay} />
                {/* Product name line 1 */}
                <Skeleton width="92%" height={14} delay={delay + 0.05} />
                {/* Product name line 2 */}
                <Skeleton width="70%" height={14} delay={delay + 0.05} />
                {/* Price */}
                <Skeleton width="52%" height={18} delay={delay + 0.1} />
                {/* Button */}
                <Skeleton height={34} delay={delay + 0.15} />
            </div>
        </div>
    )
}

// ── Product Grid Skeleton (responsive grid, staggered) ───────
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className={styles.grid}>
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} delay={i * 0.08} />
            ))}
        </div>
    )
}

// ── Product Swiper Skeleton (horizontal row) ─────────────────
export function ProductSwiperSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className={styles.swiper}>
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} delay={i * 0.08} />
            ))}
        </div>
    )
}

// ── Section Header Skeleton ──────────────────────────────────
export function SectionHeaderSkeleton() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            <Skeleton width="100px" height={10} />
            <Skeleton width="220px" height={22} />
        </div>
    )
}

// ── Catalog (Products page) Skeleton ────────────────────────
export function CatalogPageSkeleton() {
    return (
        <div>
            {/* Page header */}
            <div className={styles.pageHeader}>
                <Skeleton width="260px" height={28} />
                <Skeleton width="180px" height={12} />
            </div>

            {/* Sidebar + main grid layout */}
            <div className={styles.catalogLayout}>
                {/* Sidebar filters */}
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarGroup}>
                        <Skeleton width="80px" height={12} />
                        {[80, 90, 75, 85].map((w, i) => (
                            <Skeleton key={i} width={`${w}%`} height={32} delay={i * 0.06} />
                        ))}
                    </div>
                    <div className={styles.sidebarGroup}>
                        <Skeleton width="80px" height={12} />
                        {[70, 85, 60, 78, 65].map((w, i) => (
                            <Skeleton key={i} width={`${w}%`} height={32} delay={i * 0.06} />
                        ))}
                    </div>
                </aside>

                {/* Product grid */}
                <main>
                    <ProductGridSkeleton count={12} />
                </main>
            </div>
        </div>
    )
}