"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import LazyImage from "@/components/ui/LazyImage";
import styles from "./page.module.scss";

interface WishlistItem {
    id: string;
    name: string;
    brand: string;
    price: number;
    original: number | null;
    slug: string;
    inStock: boolean;
    rating: number;
    addedDate: string;
    image?: string;
}

function fmt(n: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

function Stars({ r }: { r: number }) {
    return (
        <span className={styles.stars}>
            {[1, 2, 3, 4, 5].map(i => (
                <span key={i} className={i <= Math.round(r) ? styles.starFull : styles.starEmpty}>★</span>
            ))}
        </span>
    );
}

export default function WishlistPage() {
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load wishlist IDs from localStorage
        const wishlistIds: string[] = JSON.parse(localStorage.getItem('ltv_wishlist') || '[]');
        if (wishlistIds.length === 0) { setLoading(false); return; }

        // Fetch product details for wishlist items
        Promise.all(
            wishlistIds.map(id =>
                fetch(`/api/products/${id}`).then(r => r.json()).catch(() => null)
            )
        ).then(results => {
            const validItems: WishlistItem[] = results
                .filter(r => r?.success && r.data)
                .map((r: any) => {
                    const p = r.data;
                    return {
                        id: p._id,
                        name: p.name,
                        brand: typeof p.brand === 'string' ? p.brand : p.brand?.name || '',
                        price: p.salePrice || p.basePrice,
                        original: p.salePrice && p.salePrice < p.basePrice ? p.basePrice : null,
                        slug: p.slug,
                        inStock: p.stock > 0,
                        rating: p.ratings?.avg || 0,
                        addedDate: new Date(p.createdAt).toLocaleDateString('vi-VN'),
                        image: p.images?.[0] || '',
                    };
                });
            setItems(validItems);
        }).finally(() => setLoading(false));
    }, []);
    const [inCart, setInCart] = useState<Set<string>>(new Set());
    const [sortBy, setSortBy] = useState("date");
    const [view, setView] = useState<"grid" | "list">("grid");

    function removeItem(id: string) {
        setItems(prev => prev.filter(i => i.id !== id));
        const wishlistIds: string[] = JSON.parse(localStorage.getItem('ltv_wishlist') || '[]');
        localStorage.setItem('ltv_wishlist', JSON.stringify(wishlistIds.filter(wid => wid !== id)));
    }

    function addToCart(id: string) {
        setInCart(prev => new Set([...prev, id]));
    }

    const sorted = [...items].sort((a, b) => {
        if (sortBy === "price_asc") return a.price - b.price;
        if (sortBy === "price_desc") return b.price - a.price;
        if (sortBy === "rating") return b.rating - a.rating;
        return 0; // date
    });

    const totalSavings = items
        .filter(i => i.original)
        .reduce((s, i) => s + ((i.original ?? i.price) - i.price), 0);

    return (
        <div className={styles.page}>
            {/* Breadcrumb */}
            <div className={styles.breadcrumbBar}>
                <div className={styles.breadcrumbInner}>
                    <nav className={styles.breadcrumb}>
                        <Link href="/" className={styles.bcLink}>Trang chủ</Link>
                        <span className={styles.bcSep}>›</span>
                        <span className={styles.bcCurrent}>Yêu thích</span>
                    </nav>
                </div>
            </div>

            {/* Header */}
            <div className={styles.pageHeader}>
                <div className={styles.pageHeaderInner}>
                    <div className={styles.headerLeft}>
                        <h1 className={styles.pageTitle}>♡ DANH SÁCH YÊU THÍCH</h1>
                        <div className={styles.headerMeta}>
                            <span className={styles.itemCount}>{items.length} sản phẩm</span>
                            {totalSavings > 0 && (
                                <span className={styles.savingsChip}>
                                    💰 Tiết kiệm được {fmt(totalSavings)} so với giá gốc
                                </span>
                            )}
                        </div>
                    </div>

                    {items.length > 0 && (
                        <div className={styles.headerActions}>
                            <Button
                                variant="cyan"
                                size="md"
                                onClick={() => setInCart(new Set(items.filter(i => i.inStock).map(i => i.id)))}
                            >
                                🛒 THÊM TẤT CẢ VÀO GIỎ
                            </Button>
                            <button
                                className={styles.shareBtn}
                                onClick={() => navigator.clipboard?.writeText(window.location.href)}
                                title="Chia sẻ danh sách"
                            >
                                🔗 Chia sẻ
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Loading */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>Đang tải danh sách yêu thích...</div>
            ) :

            /* Empty state */
            items.length === 0 ? (
                <div className={styles.emptyWrap}>
                    <div className={styles.emptyIcon}>♡</div>
                    <h2 className={styles.emptyTitle}>Danh sách trống</h2>
                    <p className={styles.emptySub}>Thêm sản phẩm yêu thích để theo dõi giá và mua sau.</p>
                    <Button variant="cyan" size="lg" href="/ban-phim">KHÁM PHÁ SẢN PHẨM →</Button>
                </div>
            ) : (
                <div className={styles.listSection}>
                    <div className={styles.listInner}>
                        {/* Toolbar */}
                        <div className={styles.toolbar}>
                            <select
                                className={styles.sortSelect}
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                            >
                                <option value="date">Mới thêm nhất</option>
                                <option value="rating">Đánh giá cao nhất</option>
                                <option value="price_asc">Giá thấp → cao</option>
                                <option value="price_desc">Giá cao → thấp</option>
                            </select>

                            <div className={styles.viewToggle}>
                                <button
                                    className={`${styles.viewBtn} ${view === "grid" ? styles.viewBtnActive : ""}`}
                                    onClick={() => setView("grid")}
                                    aria-label="Grid view"
                                >
                                    ⊞
                                </button>
                                <button
                                    className={`${styles.viewBtn} ${view === "list" ? styles.viewBtnActive : ""}`}
                                    onClick={() => setView("list")}
                                    aria-label="List view"
                                >
                                    ☰
                                </button>
                            </div>
                        </div>

                        {/* Items */}
                        <div className={view === "grid" ? styles.wishGrid : styles.wishList}>
                            {sorted.map(item => {
                                const pct = item.original
                                    ? Math.round((1 - item.price / item.original) * 100)
                                    : 0;
                                const added = inCart.has(item.id);

                                return (
                                    <div key={item.id} className={view === "grid" ? styles.wishCard : styles.wishRow}>
                                        {/* Image */}
                                        <div className={styles.imgWrap}>
                                            <Link href={`/products/${item.slug}`} className={styles.imgLink}>
                                                <div className={styles.img}>
                                                    {item.image ? (
                                                        <LazyImage src={item.image} alt={item.name} fill objectFit="cover" />
                                                    ) : (
                                                        <span>📷</span>
                                                    )}
                                                </div>
                                            </Link>
                                            {pct > 0 && <span className={styles.saleBadge}>-{pct}%</span>}
                                            {!item.inStock && <div className={styles.outStock}>Hết hàng</div>}
                                            {/* Remove btn */}
                                            <button
                                                className={styles.removeBtn}
                                                onClick={() => removeItem(item.id)}
                                                aria-label="Xóa khỏi danh sách"
                                                title="Xóa"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        {/* Info */}
                                        <div className={styles.itemInfo}>
                                            <div className={styles.itemBrand}>{item.brand}</div>
                                            <Link href={`/products/${item.slug}`} className={styles.itemName}>
                                                {item.name}
                                            </Link>
                                            <div className={styles.itemRating}>
                                                <Stars r={item.rating} />
                                                <span className={styles.ratingNum}>{item.rating}</span>
                                            </div>
                                            <div className={styles.priceRow}>
                                                <span className={styles.itemPrice}>{fmt(item.price)}</span>
                                                {item.original && (
                                                    <span className={styles.itemOriginal}>{fmt(item.original)}</span>
                                                )}
                                            </div>
                                            <span className={styles.addedDate}>Thêm {item.addedDate}</span>
                                        </div>

                                        {/* Actions */}
                                        <div className={styles.itemActions}>
                                            {item.inStock ? (
                                                <Button
                                                    variant={added ? "outline-cyan" : "cyan"}
                                                    size="sm"
                                                    fullWidth
                                                    onClick={() => addToCart(item.id)}
                                                >
                                                    {added ? "✓ ĐÃ THÊM" : "🛒 THÊM VÀO GIỎ"}
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="sm" fullWidth disabled>
                                                    Hết hàng
                                                </Button>
                                            )}
                                            <Button variant="outline" size="sm" fullWidth href={`/products/${item.slug}`}>
                                                XEM SẢN PHẨM
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
