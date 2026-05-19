// ============================================================
// NEXGEAR — ProductCard Component
// File: components/product/ProductCard.tsx
// ============================================================
'use client'
import { useState, memo } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import LazyImage from '@/components/ui/LazyImage'
import { StockBadge } from '@/components/ui/Badge'
import { useCart } from '@/contexts/CartContext'
import { useCompareStore } from '@/store/useCompareStore'
import styles from './ProductCard.module.scss'

interface Product {
  _id: string
  name: string
  slug: string
  sku: string
  brand: { name: string }
  images: string[]
  basePrice: number
  salePrice?: number | null
  stock: number
  ratings: { avg: number; count: number }
  tags?: string[]
  isFeatured?: boolean
  specs?: Record<string, string>
  category?: { _id: string; name: string } | string
}

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
  className?: string
}

// ── Format price VNĐ ────────────────────────────────────────
function formatPrice(price: number): string {
  if (!price || price === 0) return 'Liên hệ'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND',
  }).format(price)
}

// ── Star Rating ─────────────────────────────────────────────
function StarRating({ avg, count }: { avg: number; count: number }) {
  return (
    <div className={styles.rating}>
      <span className={styles.stars} aria-label={`${avg} sao`}>
        {'★'.repeat(Math.floor(avg))}{'☆'.repeat(5 - Math.floor(avg))}
      </span>
      <span className={styles.ratingCount}>({count})</span>
    </div>
  )
}

const ProductCard = ({ product, onAddToCart, className = '' }: ProductCardProps) => {
  const { addItem } = useCart()
  const [wishlisted, setWishlisted] = useState(() => {
    if (typeof window === 'undefined') return false
    const ids: string[] = JSON.parse(localStorage.getItem('nexgear_wishlist') || '[]')
    return ids.includes(product._id)
  })
  const [added, setAdded] = useState(false)

  // Compare state
  const { items: compareItems, addItem: addCompare, removeItem: removeCompare } = useCompareStore()
  const isCompared = compareItems.some(i => i.id === product._id)

  const [loadingCompare, setLoadingCompare] = useState(false)

  const toggleCompare = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (isCompared) {
      removeCompare(product._id)
      return
    }
    if (compareItems.length >= 3) {
      alert("Bạn chỉ có thể so sánh tối đa 3 sản phẩm cùng lúc. Vui lòng xoá bớt sản phẩm trong trang So Sánh.")
      return
    }

    const catId = typeof product.category === 'object' && product.category !== null
      ? product.category._id
      : String(product.category || 'unknown')

    // Fetch full specs if missing (list API strips specs for performance)
    let specs = product.specs || {}
    if (!specs || Object.keys(specs).length === 0) {
      try {
        setLoadingCompare(true)
        const res = await fetch(`/api/products/${product._id}`)
        const json = await res.json()
        if (json.success && json.data?.specs) {
          specs = json.data.specs
        }
      } catch { /* use empty specs as fallback */ }
      finally { setLoadingCompare(false) }
    }

    addCompare({
      id: product._id,
      slug: product.slug,
      name: product.name,
      categoryId: catId,
      brand: typeof product.brand === 'string' ? product.brand : product.brand?.name || 'NexGear',
      price: product.salePrice ?? product.basePrice,
      original: product.basePrice,
      rating: product.ratings?.avg || 5,
      img: product.images?.[0] || '⌨',
      specs,
    })
  }

  const hasDiscount = product.basePrice > 0 && product.salePrice && product.salePrice < product.basePrice
  const discountPct = hasDiscount
    ? Math.round((1 - product.salePrice! / product.basePrice) * 100)
    : 0

  const isNew = product.tags?.includes('new')
  const isHot = product.tags?.includes('hot')
  const outOfStock = product.stock === 0

  function handleAddToCart() {
    if (outOfStock) return
    addItem({
      productId: product._id,
      slug: product.slug,
      name: product.name,
      brand: typeof product.brand === 'string' ? product.brand : product.brand?.name || '',
      sku: product.sku,
      image: product.images?.[0] || '',
      basePrice: product.basePrice,
      salePrice: product.salePrice ?? null,
      stock: product.stock,
    })
    onAddToCart?.(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <article className={`${styles.card} ${outOfStock ? styles['card--oos'] : ''} ${className}`}>
      {/* ── IMAGE ── */}
      <Link href={`/products/${product.slug}`} className={styles.imageWrap} prefetch={true}>
        <div className={styles.image}>
          {product.images?.[0] ? (
            <LazyImage
              src={product.images[0]}
              alt={product.name}
              fill
              objectFit="cover"
              className={styles.img}
            />
          ) : (
            <div className={styles.imageFallback}>📷</div>
          )}
        </div>

        {/* Badges */}
        <div className={styles.badgesTop}>
          {hasDiscount && <span className={`${styles.badge} ${styles['badge--sale']}`}>-{discountPct}%</span>}
          {isNew && <span className={`${styles.badge} ${styles['badge--new']}`}>NEW</span>}
          {isHot && <span className={`${styles.badge} ${styles['badge--hot']}`}>🔥 HOT</span>}
        </div>

        {/* Out-of-stock cyber overlay */}
        {outOfStock && (
          <div className={styles.oosOverlay}>
            <div className={styles.oosLabel}>
              <div className={styles.oosIcon}>
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4" y1="4" x2="20" y2="20" />
                </svg>
              </div>
              <span className={styles.oosText}>HẾT HÀNG</span>
            </div>
          </div>
        )}
      </Link>

      {/* Wishlist + Compare: grouped in top-right corner of image */}
      <div className={styles.cardActions}>
        <button
          className={`${styles.wishlist} ${wishlisted ? styles['wishlist--active'] : ''}`}
          onClick={() => {
            const ids: string[] = JSON.parse(localStorage.getItem('nexgear_wishlist') || '[]')
            const next = wishlisted ? ids.filter(id => id !== product._id) : [...ids, product._id]
            localStorage.setItem('nexgear_wishlist', JSON.stringify(next))
            setWishlisted(v => !v)
          }}
          aria-label={wishlisted ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
        >
          {wishlisted ? '♥' : '♡'}
        </button>
        <button
          className={`${styles.compareBtn} ${isCompared ? styles['compare--active'] : ''}`}
          onClick={toggleCompare}
          disabled={loadingCompare}
          aria-label={isCompared ? 'Xóa khỏi so sánh' : 'Thêm vào so sánh'}
          title="So sánh"
        >
          {loadingCompare ? '⏳' : '⚖️'}
        </button>
      </div>

      {/* ── BODY ── */}
      <div className={styles.body}>
        <Link href={`/products/${product.slug}`} className={styles.bodyLink} prefetch={true}>
          <div className={styles.brand}>{typeof product.brand === 'string' ? product.brand : product.brand?.name || ''}</div>
          <h3 className={styles.name}>{product.name}</h3>

        </Link>

        {/* Price */}
        <div className={styles.priceRow}>
          <div className={styles.prices}>
            <span className={styles.price}>
              {formatPrice(product.salePrice ?? product.basePrice)}
            </span>
            {hasDiscount && (
              <span className={styles.originalPrice}>
                {formatPrice(product.basePrice)}
              </span>
            )}
          </div>

        </div>

        {/* Add to Cart */}
        <Button
          variant={outOfStock ? 'ghost' : added ? 'cyan' : 'primary'}
          size="sm"
          fullWidth
          className={styles.addBtn}
          onClick={handleAddToCart}
          disabled={outOfStock}
        >
          {outOfStock ? '⚡ THÔNG BÁO KHI CÓ HÀNG' : added ? '✓ ĐÃ THÊM VÀO GIỎ' : '🛒 THÊM VÀO GIỎ'}
        </Button>
      </div>
    </article>
  )
}

export default memo(ProductCard)
