"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import LazyImage from "@/components/ui/LazyImage";
import styles from "./page.module.scss";

interface DealProduct {
    _id: string;
    name: string;
    slug: string;
    basePrice: number;
    salePrice: number | null;
    stock: number;
    soldCount: number;
    brand?: { name: string };
    category?: { _id: string; name: string; slug: string };
    images: string[];
    tags: string[];
}

function fmt(n: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

// ── Countdown ───────────────────────────────────────────────
function useCountdown(target: Date) {
    const [left, setLeft] = useState(target.getTime() - Date.now());
    useEffect(() => {
        const id = setInterval(() => setLeft(target.getTime() - Date.now()), 1000);
        return () => clearInterval(id);
    }, [target]);
    const s = Math.max(0, Math.floor(left / 1000));
    return {
        h: String(Math.floor(s / 3600)).padStart(2, "0"),
        m: String(Math.floor((s % 3600) / 60)).padStart(2, "0"),
        s: String(s % 60).padStart(2, "0"),
    };
}

function CountdownTimer() {
    const endTime = React.useMemo(() => {
        const d = new Date();
        d.setHours(23, 59, 59, 0);
        return d;
    }, []);
    const { h, m, s } = useCountdown(endTime);

    return (
        <div className={styles.countdown}>
            <span className={styles.countLabel}>Kết thúc sau:</span>
            <div className={styles.countBlocks}>
                <div className={styles.countBlock}>
                    <span className={styles.countNum}>{h}</span>
                    <span className={styles.countUnit}>GIỜ</span>
                </div>
                <span className={styles.countColon}>:</span>
                <div className={styles.countBlock}>
                    <span className={styles.countNum}>{m}</span>
                    <span className={styles.countUnit}>PHÚT</span>
                </div>
                <span className={styles.countColon}>:</span>
                <div className={styles.countBlock}>
                    <span className={styles.countNum}>{s}</span>
                    <span className={styles.countUnit}>GIÂY</span>
                </div>
            </div>
        </div>
    );
}

// ── Stock bar ───────────────────────────────────────────────
function StockBar({ sold }: { sold: number }) {
    return (
        <div className={styles.stockWrap}>
            <div className={styles.stockBar}>
                <div className={styles.stockFill} style={{ width: `${Math.min(sold, 100)}%` }} />
            </div>
            <span className={styles.stockText}>
                {sold >= 90 ? "🔥 Sắp hết!" : sold >= 70 ? "⚡ Đang hot" : "Đã bán"}
                {" "}{sold}%
            </span>
        </div>
    );
}

// ── Deal Card ───────────────────────────────────────────────
function DealCard({ p }: { p: DealProduct }) {
    const [inCart, setInCart] = useState(false);
    const pct = p.salePrice ? Math.round((1 - p.salePrice / p.basePrice) * 100) : 0;
    const soldPct = Math.min(Math.round((p.soldCount / Math.max(p.soldCount + p.stock, 1)) * 100), 100);
    const isHot = p.tags?.includes('hot') || soldPct >= 70;

    return (
        <div className={`${styles.dealCard} ${p.stock <= 5 ? styles.dealCardLow : ""}`}>
            <div className={styles.dealBadges}>
                {pct > 0 && <span className={styles.saleBadge}>-{pct}%</span>}
                {isHot && <span className={styles.hotBadge}>🔥 HOT</span>}
                {p.stock <= 5 && <span className={styles.lowBadge}>⚠ CÒN {p.stock}</span>}
            </div>

            <Link href={`/products/${p.slug}`} className={styles.dealImgWrap}>
                <div className={styles.dealImg}>
                    {p.images?.[0]
                        ? <LazyImage src={p.images[0]} alt={p.name} fill objectFit="cover" />
                        : <span className={styles.dealImgFallback}>📷</span>
                    }
                </div>
            </Link>

            <div className={styles.dealInfo}>
                <div className={styles.dealBrand}>{p.brand?.name || ''}</div>
                <Link href={`/products/${p.slug}`} className={styles.dealName}>{p.name}</Link>

                <div className={styles.dealPrices}>
                    <span className={styles.dealSale}>{fmt(p.salePrice || p.basePrice)}</span>
                    {p.salePrice && <span className={styles.dealOriginal}>{fmt(p.basePrice)}</span>}
                </div>

                <StockBar sold={soldPct} />

                <Button
                    variant={inCart ? "outline-cyan" : "cyan"}
                    size="sm"
                    fullWidth
                    onClick={() => setInCart(!inCart)}
                >
                    {inCart ? "✓ ĐÃ THÊM" : "🛒 THÊM VÀO GIỎ"}
                </Button>
            </div>
        </div>
    );
}

export default function DealsClient() {
    const [filter, setFilter] = useState("all");
    const [products, setProducts] = useState<DealProduct[]>([]);
    const [categories, setCategories] = useState<{ _id: string; slug: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/products?tag=sale&active=true&limit=20&sort=-soldCount').then(r => r.json()),
            fetch('/api/categories?limit=20').then(r => r.json()),
        ]).then(([prodRes, catRes]) => {
            if (prodRes.success) setProducts(prodRes.data);
            if (catRes.success) setCategories(catRes.data);
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    const CATS = [
        { id: "all", label: "Tất cả" },
        ...categories.map(c => ({ id: c._id, label: c.name })),
    ];

    const shown = filter === "all"
        ? products
        : products.filter(p => p.category?._id === filter);

    const maxPct = products.reduce((max, p) => {
        const pct = p.salePrice ? Math.round((1 - p.salePrice / p.basePrice) * 100) : 0;
        return Math.max(max, pct);
    }, 0);

    return (
        <div className={styles.page}>
            {/* Hero banner */}
            <div className={styles.heroBanner}>
                <div className={styles.heroBg} aria-hidden="true">
                    {Array.from({ length: 40 }).map((_, i) => (
                        <span key={i} className={styles.heroDot} style={{ animationDelay: `${i * 0.08}s` }} />
                    ))}
                </div>
                <div className={styles.heroInner}>
                    <div className={styles.heroLeft}>
                        <div className={styles.heroEyebrow}>⚡ FLASH SALE</div>
                        <h1 className={styles.heroTitle}>GIẢM GIÁ SỐC</h1>
                        <p className={styles.heroSub}>Cơ hội vàng sở hữu gaming gear xịn với giá tốt nhất trong ngày</p>
                        <CountdownTimer />
                    </div>
                    <div className={styles.heroRight}>
                        <div className={styles.heroBigSale}>
                            <span className={styles.heroBigPct}>-{maxPct || 40}%</span>
                            <span className={styles.heroBigLabel}>TỐI ĐA</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category filter */}
            <div className={styles.filterBar}>
                <div className={styles.filterBarInner}>
                    {CATS.map(c => (
                        <button
                            key={c.id}
                            className={`${styles.filterChip} ${filter === c.id ? styles.filterChipActive : ""}`}
                            onClick={() => setFilter(c.id)}
                        >
                            {c.label}
                        </button>
                    ))}
                    <div className={styles.filterCount}>{shown.length} sản phẩm</div>
                </div>
            </div>

            {/* Products grid */}
            <div className={styles.gridSection}>
                <div className={styles.gridInner}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.5)' }}>Đang tải deals...</div>
                    ) : shown.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.4)' }}>Chưa có deal nào</div>
                    ) : (
                        <div className={styles.dealGrid}>
                            {shown.map(p => <DealCard key={p._id} p={p} />)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
