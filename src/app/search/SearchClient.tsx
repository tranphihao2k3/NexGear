"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import LazyImage from "@/components/ui/LazyImage";
import styles from "./page.module.scss";

const SUGGESTIONS = ["bàn phím bluetooth", "chuột gaming không dây", "tai nghe anc", "keychron k2", "logitech g pro", "razer huntsman"];

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

interface SearchProduct {
    _id: string;
    name: string;
    slug: string;
    basePrice: number;
    salePrice?: number;
    hidePrice?: boolean;
    images: string[];
    brand?: { name: string };
    category?: { name: string };
    ratings?: { avg: number; count: number };
    tags: string[];
}

// ── Search inner (needs useSearchParams) ──────────────────
function SearchInner() {
    const params = useSearchParams();
    const initQ = params.get("q") ?? "";
    const [query, setQuery] = useState(initQ);
    const [input, setInput] = useState(initQ);
    const [sort, setSort] = useState("relevance");
    const [catFilter, setCatFilter] = useState("all");
    const [showSugg, setShowSugg] = useState(false);
    const [results, setResults] = useState<SearchProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const fetchResults = useCallback(async (q: string) => {
        if (!q.trim()) { setResults([]); return; }
        setLoading(true);
        try {
            const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&active=true&limit=20`);
            const data = await res.json();
            if (data.success) setResults(data.data);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { if (initQ) fetchResults(initQ); }, [initQ, fetchResults]);

    const cats = ["all", ...Array.from(new Set(results.map(p => p.category?.name).filter((n): n is string => !!n)))];
    const filtered = catFilter === "all" ? results : results.filter(p => p.category?.name === catFilter);

    const sorted = [...filtered].sort((a, b) => {
        const priceA = a.salePrice || a.basePrice;
        const priceB = b.salePrice || b.basePrice;
        if (sort === "price_asc") return priceA - priceB;
        if (sort === "price_desc") return priceB - priceA;
        if (sort === "rating") return (b.ratings?.avg || 0) - (a.ratings?.avg || 0);
        return 0;
    });

    function handleSearch(q: string) {
        setInput(q);
        setQuery(q);
        setShowSugg(false);
        fetchResults(q);
    }

    function handleKey(e: React.KeyboardEvent) {
        if (e.key === "Enter") { handleSearch(input); }
        if (e.key === "Escape") setShowSugg(false);
    }

    const recentSearches = ["keychron k2", "logitech gpx2", "sony xm5"];

    return (
        <div className={styles.page}>
            {/* Search hero */}
            <div className={styles.searchHero}>
                <div className={styles.searchHeroInner}>
                    <h1 className={styles.searchTitle}>TÌM KIẾM SẢN PHẨM</h1>

                    {/* Search box */}
                    <div className={styles.searchBoxWrap}>
                        <div className={styles.searchBox}>
                            <span className={styles.searchIcon}>🔍</span>
                            <input
                                ref={inputRef}
                                className={styles.searchInput}
                                placeholder="Tìm bàn phím, chuột, tai nghe..."
                                value={input}
                                onChange={e => { setInput(e.target.value); setShowSugg(true); }}
                                onKeyDown={handleKey}
                                onFocus={() => setShowSugg(true)}
                                onBlur={() => setTimeout(() => setShowSugg(false), 150)}
                                autoComplete="off"
                            />
                            {input && (
                                <button
                                    className={styles.clearBtn}
                                    onClick={() => { setInput(""); setQuery(""); setResults([]); inputRef.current?.focus(); }}
                                    aria-label="Xóa"
                                >
                                    ✕
                                </button>
                            )}
                            <button className={styles.searchBtn} onClick={() => handleSearch(input)}>
                                TÌM →
                            </button>
                        </div>

                        {/* Suggestions dropdown */}
                        {showSugg && (
                            <div className={styles.suggBox}>
                                {!input ? (
                                    <>
                                        <div className={styles.suggSection}>
                                            <div className={styles.suggLabel}>🕐 Tìm kiếm gần đây</div>
                                            {recentSearches.map(s => (
                                                <button key={s} className={styles.suggItem} onMouseDown={() => handleSearch(s)}>
                                                    <span>🕐</span> {s}
                                                    <span className={styles.suggArrow}>↗</span>
                                                </button>
                                            ))}
                                        </div>
                                        <div className={styles.suggSection}>
                                            <div className={styles.suggLabel}>🔥 Xu hướng tìm kiếm</div>
                                            {SUGGESTIONS.slice(0, 4).map(s => (
                                                <button key={s} className={styles.suggItem} onMouseDown={() => handleSearch(s)}>
                                                    <span>🔥</span> {s}
                                                    <span className={styles.suggArrow}>↗</span>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    SUGGESTIONS.filter(s => s.includes(input.toLowerCase())).map(s => (
                                        <button key={s} className={styles.suggItem} onMouseDown={() => handleSearch(s)}>
                                            <span>🔍</span> {s}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Hot tags */}
                    <div className={styles.hotTags}>
                        <span className={styles.hotTagsLabel}>🔥 Hot:</span>
                        {["bàn phím 65%", "chuột gaming", "tai nghe anc", "keychron"].map(tag => (
                            <button key={tag} className={styles.hotTag} onClick={() => handleSearch(tag)}>
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className={styles.resultsSection}>
                <div className={styles.resultsInner}>

                    {/* Loading */}
                    {loading && (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>
                            Đang tìm kiếm...
                        </div>
                    )}

                    {/* No results */}
                    {!loading && query && results.length === 0 && (
                        <div className={styles.noResults}>
                            <div className={styles.noResultsIcon}>🔍</div>
                            <h2 className={styles.noResultsTitle}>Không tìm thấy &ldquo;{query}&rdquo;</h2>
                            <p className={styles.noResultsSub}>Thử tìm với từ khóa khác hoặc xem các gợi ý bên dưới</p>
                            <div className={styles.suggChips}>
                                {SUGGESTIONS.map(s => (
                                    <button key={s} className={styles.suggChip} onClick={() => handleSearch(s)}>{s}</button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Results */}
                    {!loading && sorted.length > 0 && (
                        <>
                            <div className={styles.toolbar}>
                                <div className={styles.toolbarLeft}>
                                    <span className={styles.resultCount}>
                                        Tìm thấy <strong>{sorted.length}</strong> kết quả cho &ldquo;<em>{query}</em>&rdquo;
                                    </span>
                                    <div className={styles.catChips}>
                                        {cats.map(c => (
                                            <button
                                                key={c}
                                                className={`${styles.catChip} ${catFilter === c ? styles.catChipActive : ""}`}
                                                onClick={() => setCatFilter(c)}
                                            >
                                                {c === "all" ? "Tất cả" : c}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <select className={styles.sortSelect} value={sort} onChange={e => setSort(e.target.value)}>
                                    <option value="relevance">Liên quan nhất</option>
                                    <option value="rating">Đánh giá cao nhất</option>
                                    <option value="price_asc">Giá thấp → cao</option>
                                    <option value="price_desc">Giá cao → thấp</option>
                                </select>
                            </div>

                            <div className={styles.resultList}>
                                {sorted.map(p => (
                                    <Link key={p._id} href={`/products/${p.slug}`} className={styles.resultCard}>
                                        <div className={styles.resultImg}>
                                            {p.images?.[0]
                                                ? <LazyImage src={p.images[0]} alt={p.name} fill objectFit="cover" />
                                                : <span>📷</span>
                                            }
                                        </div>
                                        <div className={styles.resultInfo}>
                                            <div className={styles.resultBrand}>{p.brand?.name || 'N/A'} · {p.category?.name || 'N/A'}</div>
                                            <div className={styles.resultName}>{p.name}</div>
                                            <div className={styles.resultTags}>
                                                {p.tags?.map(t => <span key={t} className={styles.tagChip}>{t}</span>)}
                                            </div>
                                            <div className={styles.resultMeta}>
                                                <Stars r={p.ratings?.avg || 0} />
                                                <span className={styles.resultRating}>{p.ratings?.avg?.toFixed(1) || '0'}</span>
                                                <span className={styles.resultRatingCount}>({p.ratings?.count || 0} đánh giá)</span>
                                            </div>
                                        </div>
                                        <div className={styles.resultRight}>
                                            <div className={styles.resultPrice}>{p.hidePrice ? 'Liên hệ' : fmt(p.salePrice || p.basePrice)}</div>
                                            <div className={styles.resultCta}>XEM NGAY →</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Initial state */}
                    {!loading && !query && (
                        <div className={styles.initialState}>
                            <div className={styles.trendingSection}>
                                <div className={styles.trendingLabel}>📈 XU HƯỚNG TÌM KIẾM</div>
                                <div className={styles.trendingGrid}>
                                    {SUGGESTIONS.map((s, i) => (
                                        <button key={s} className={styles.trendingCard} onClick={() => handleSearch(s)}>
                                            <span className={styles.trendingRank}>{i + 1}</span>
                                            <span className={styles.trendingText}>{s}</span>
                                            <span className={styles.trendingArrow}>→</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg)" }} />}>
            <SearchInner />
        </Suspense>
    );
}
