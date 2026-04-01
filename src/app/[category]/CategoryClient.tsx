"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import { ProductGridSkeleton } from "@/components/ui";
import Button from "@/components/ui/Button";
import LazyImage from "@/components/ui/LazyImage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import styles from "./page.module.scss";

// Category meta is now fetched from API instead of hardcoded

// ── SPEC FILTER CONFIG PER CATEGORY ─────────────────────────
// Keys here match the NORMALIZED filter keys from API (after spec-normalize).
// "Màn hình" in DB → becomes "Kích thước màn hình" + "Độ phân giải" after normalization.
const CATEGORY_SPEC_FILTERS: Record<string, string[]> = {
    "ban-phim": ["Switch", "Layout", "Kết nối", "Đèn LED"],
    "chuot": ["Sensor", "DPI", "Kết nối", "Cân nặng"],
    "tai-nghe": ["Driver", "Kết nối", "ANC", "Pin"],
    "loa-mic": ["Công suất", "Kết nối", "Pin"],
    "loa": ["Công suất", "Kết nối", "Pin"],
    "phu-kien": [],
    "laptop": ["CPU", "RAM", "GPU", "Kích thước màn hình", "Độ phân giải", "Tần số quét", "Ổ cứng"],
    // Laptop sub-cats inherit
    "gaming-laptop": ["CPU", "RAM", "GPU", "Kích thước màn hình", "Độ phân giải", "Tần số quét", "Ổ cứng"],
    "ultrabook": ["CPU", "RAM", "GPU", "Kích thước màn hình", "Độ phân giải", "Ổ cứng"],
    "workstation": ["CPU", "RAM", "GPU", "Kích thước màn hình", "Độ phân giải", "Ổ cứng"],
    "laptop-sinh-vien": ["CPU", "RAM", "GPU", "Kích thước màn hình", "Ổ cứng"],
    // Chuột sub-cats inherit
    "chuot-gaming": ["Sensor", "DPI", "Kết nối", "Cân nặng"],
    "chuot-wireless": ["Sensor", "DPI", "Kết nối", "Cân nặng"],
    "chuot-ergonomic": ["Sensor", "Kết nối", "Cân nặng"],
    "chuot-sieu-nhe": ["Sensor", "DPI", "Kết nối", "Cân nặng"],
    // Bàn phím sub-cats inherit
    "ban-phim-co": ["Switch", "Layout", "Kết nối", "Đèn LED"],
    "ban-phim-khong-day": ["Switch", "Layout", "Kết nối", "Đèn LED"],
    "ban-phim-tkl": ["Switch", "Kết nối", "Đèn LED"],
    "ban-phim-60": ["Switch", "Kết nối", "Đèn LED"],
    "custom-kit": ["Switch", "Layout", "Kết nối"],
    // Tai nghe sub-cats inherit
    "tai-nghe-over-ear": ["Driver", "Kết nối", "ANC", "Pin"],
    "tai-nghe-in-ear": ["Driver", "Kết nối", "ANC", "Pin"],
    "tai-nghe-gaming": ["Driver", "Kết nối", "ANC"],
    // Loa sub-cats inherit
    "soundbar": ["Công suất", "Kết nối"],
    "loa-bluetooth": ["Công suất", "Kết nối", "Pin"],
    "loa-desktop": ["Công suất", "Kết nối"],
    // Phụ kiện sub-cats
    "keycap": [],
    "switch": [],
    "mouse-pad": [],
    "cable-hub": [],
    "wrist-rest": [],
    // Linh kiện sub-cats
    "linh-kien": ["Loại linh kiện", "Dung lượng", "Chuẩn kết nối"],
    "ram": ["Dung lượng", "Bus", "Loại RAM"],
    "ssd": ["Dung lượng", "Chuẩn giao tiếp", "Tốc độ đọc"],
    "sac-laptop": ["Công suất", "Đầu cắm"],
    "pin-laptop": ["Dung lượng", "Thương hiệu tương thích"],
    "tannhiet": ["Loại tản nhiệt", "Kích thước"],
};

// Each spec filter option from API
interface SpecFilterOption {
    normalized: string;  // Display label (e.g. "Intel Core i5-12450H")
    rawValues: string[]; // All raw DB values mapping to this (for query)
}

const SORT_OPTIONS = [
    { value: "-createdAt", label: "Mới nhất" },
    { value: "-soldCount", label: "Bán chạy" },
    { value: "price-asc", label: "Giá tăng dần" },
    { value: "price-desc", label: "Giá giảm dần" },
];

const PRODUCTS_PER_PAGE = 12;

function formatPrice(v: number) {
    return new Intl.NumberFormat("vi-VN").format(v) + "₫";
}

// ── CHECKBOX GROUP ───────────────────────────────────────────
function FilterDropdown({
    label,
    options,
    selected,
    onChange,
}: {
    label: string;
    options: { id: string; name: string }[];
    selected: Set<string>;
    onChange: (val: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const count = selected.size;

    return (
        <div className={styles.filterGroup}>
            <button
                type="button"
                className={`${styles.filterGroupLabel} ${styles.filterToggle} ${open ? styles.filterToggleOpen : ''}`}
                onClick={() => setOpen(!open)}
            >
                <span>{label} {count > 0 && <span className={styles.filterCount}>{count}</span>}</span>
                <span className={`${styles.filterArrow} ${open ? styles.filterArrowOpen : ''}`}>▾</span>
            </button>
            {open && (
                <div className={styles.checkGroup}>
                    {options.map((opt) => (
                        <label key={opt.id} className={styles.checkLabel}>
                            <input
                                type="checkbox"
                                className={styles.checkInput}
                                checked={selected.has(opt.id)}
                                onChange={() => onChange(opt.id)}
                            />
                            <span className={styles.checkBox} />
                            <span className={styles.checkText}>{opt.name}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── PROPS ────────────────────────────────────────────────────
interface CategoryClientProps {
    categorySlug: string;
    h1: string;
}

// ── PAGE ─────────────────────────────────────────────────────
export default function CategoryClient({ categorySlug, h1 }: CategoryClientProps) {
    const catSlug = categorySlug;

    // UI State (not fetched)
    const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 10_000_000]);
    const [sort, setSort] = useState("-createdAt");
    const [view, setView] = useState<"grid4" | "grid3" | "list">("grid4");
    const [page, setPage] = useState(1);
    const [sidebarMobile, setSidebarMobile] = useState(false);
    const [selectedSpecs, setSelectedSpecs] = useState<Record<string, Set<string>>>({});

    // ── 1. All categories (for sub-cat tabs + finding category ID) ─
    const { data: allCategories = [] } = useQuery({
        queryKey: queryKeys.categories.list({ limit: 50 }),
        queryFn: () => fetch('/api/categories?limit=50').then(r => r.json()).then(d => d.success ? d.data : []),
        staleTime: 1000 * 60 * 30, // 30 phút — danh mục hiếm thay đổi
    });

    // Derive meta from API data
    const categoryObj = allCategories.find((c: any) => c.slug === catSlug);
    const parentObj = categoryObj?.parent
        ? (typeof categoryObj.parent === 'object' ? categoryObj.parent : allCategories.find((c: any) => c._id === categoryObj.parent))
        : null;
    const parentSlug = parentObj?.slug || null;
    const meta = {
        label: categoryObj?.name || catSlug,
        h1: h1 || categoryObj?.name || catSlug,
        desc: categoryObj?.description || categoryObj?.metaDescription || '',
    };

    // Derive sub-category tabs from cached allCategories (no extra fetch needed)
    const targetSlug = parentSlug || catSlug;
    const targetCat = allCategories.find((c: any) => c.slug === targetSlug);
    const subCatTabs: { _id: string; slug: string; name: string }[] = targetCat
        ? allCategories.filter((c: any) =>
            c.parent && (
                typeof c.parent === 'string'
                    ? c.parent === targetCat._id
                    : c.parent._id === targetCat._id
            )
        )
        : [];

    // ── 2. Brands for this category ──────────────────────────────
    const { data: brands = [] } = useQuery({
        queryKey: queryKeys.brands.list({ categorySlug: catSlug, hasProducts: true, limit: 50 }),
        queryFn: () =>
            fetch(`/api/brands?limit=50&hasProducts=true&categorySlug=${catSlug}`)
                .then(r => r.json())
                .then(d => d.success ? d.data.map((b: any) => ({ id: b._id, name: b.name })) : []),
        staleTime: 1000 * 60 * 30,
    });

    // ── 3. Spec filters for this category ────────────────────────
    const { data: rawSpecFilters = {} } = useQuery({
        queryKey: ['products', 'specs', catSlug],
        queryFn: () =>
            fetch(`/api/products/specs?categorySlug=${catSlug}`)
                .then(r => r.json())
                .then(d => d.success ? (d.data.filters || {}) : {}),
        staleTime: 1000 * 60 * 30,
    });

    // Filter allowed spec keys per category
    const allowedKeys = CATEGORY_SPEC_FILTERS[catSlug];
    const specFilters: Record<string, SpecFilterOption[]> = allowedKeys != null
        ? allowedKeys.length === 0
            ? {}
            : Object.fromEntries(
                allowedKeys
                    .filter(k => (rawSpecFilters as any)[k]?.length)
                    .map(k => [k, (rawSpecFilters as any)[k]])
            )
        : rawSpecFilters as Record<string, SpecFilterOption[]>;

    // ── 4. Products (re-fetches when filters/page/sort change) ───
    const specParts: string[] = [];
    for (const [filterKey, selectedNorms] of Object.entries(selectedSpecs)) {
        if (selectedNorms.size === 0) continue;
        const options = specFilters[filterKey] || [];
        const rawVals: string[] = [];
        for (const opt of options) {
            if (selectedNorms.has(opt.normalized)) rawVals.push(...opt.rawValues);
        }
        if (rawVals.length > 0) {
            const dbKey = (filterKey === 'Kích thước màn hình' || filterKey === 'Độ phân giải')
                ? 'Màn hình' : filterKey;
            specParts.push(`${dbKey}:${rawVals.join('|')}`);
        }
    }

    const productQueryParams = {
        catSlug,
        page,
        sort,
        brands: Array.from(selectedBrands).join(','),
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 10_000_000 ? priceRange[1] : undefined,
        specs: specParts.join(',') || undefined,
    };

    const { data: productResult, isPending: loading } = useQuery({
        queryKey: ['products', 'category', productQueryParams],
        queryFn: async () => {
            const params = new URLSearchParams({
                active: 'true',
                limit: String(PRODUCTS_PER_PAGE),
                page: String(page),
                sort,
                categorySlug: catSlug,
            });
            if (selectedBrands.size > 0) params.set('brand', Array.from(selectedBrands).join(','));
            if (priceRange[0] > 0) params.set('minPrice', String(priceRange[0]));
            if (priceRange[1] < 10_000_000) params.set('maxPrice', String(priceRange[1]));
            if (specParts.length > 0) params.set('specs', specParts.join(','));
            const res = await fetch(`/api/products?${params}`);
            const data = await res.json();
            return data.success
                ? { products: data.data, total: data.pagination?.total || 0 }
                : { products: [], total: 0 };
        },
        placeholderData: prev => prev, // giữ data cũ khi thay đổi filter
        staleTime: 1000 * 60 * 5,
    });

    const products = productResult?.products ?? [];
    const totalCount = productResult?.total ?? 0;
    const totalPages = Math.ceil(totalCount / PRODUCTS_PER_PAGE) || 1;

    // ── PREFETCH trang tiếp theo ─────────────────────────────────
    const queryClient = useQueryClient();
    useEffect(() => {
        if (page < totalPages) {
            const nextPage = page + 1;
            const nextParams = { ...productQueryParams, page: nextPage };
            queryClient.prefetchQuery({
                queryKey: ['products', 'category', nextParams],
                queryFn: async () => {
                    const params = new URLSearchParams({
                        active: 'true',
                        limit: String(PRODUCTS_PER_PAGE),
                        page: String(nextPage),
                        sort,
                        categorySlug: catSlug,
                    });
                    if (selectedBrands.size > 0) params.set('brand', Array.from(selectedBrands).join(','));
                    if (priceRange[0] > 0) params.set('minPrice', String(priceRange[0]));
                    if (priceRange[1] < 10_000_000) params.set('maxPrice', String(priceRange[1]));
                    if (specParts.length > 0) params.set('specs', specParts.join(','));
                    const res = await fetch(`/api/products?${params}`);
                    const data = await res.json();
                    return data.success
                        ? { products: data.data, total: data.pagination?.total || 0 }
                        : { products: [], total: 0 };
                },
                staleTime: 1000 * 60 * 5,
            });
        }
    }, [page, totalPages, productQueryParams]);

    // ── HANDLERS ─────────────────────────────────────────────────
    const toggleBrand = useCallback((brandId: string) => {
        setSelectedBrands(prev => {
            const next = new Set(prev);
            next.has(brandId) ? next.delete(brandId) : next.add(brandId);
            return next;
        });
        setPage(1);
    }, []);

    const toggleSpec = useCallback((specKey: string, value: string) => {
        setSelectedSpecs(prev => {
            const next = { ...prev };
            const set = new Set(prev[specKey] || []);
            set.has(value) ? set.delete(value) : set.add(value);
            if (set.size === 0) delete next[specKey];
            else next[specKey] = set;
            return next;
        });
        setPage(1);
    }, []);

    const clearAll = () => {
        setSelectedBrands(new Set());
        setSelectedSpecs({});
        setPriceRange([0, 10_000_000]);
        setPage(1);
    };

    const specActiveCount = Object.values(selectedSpecs).reduce((sum, s) => sum + s.size, 0);
    const activeCount = selectedBrands.size + specActiveCount;

    return (
        <div className={styles.page}>

            {/* ── BREADCRUMB + HEADER ── */}
            <div className={styles.pageHeader}>
                <div className={styles.pageHeaderInner}>
                    <nav className={styles.breadcrumb} aria-label="Breadcrumb">
                        <Link href="/" className={styles.bcLink}>Trang chủ</Link>
                        <span className={styles.bcSep}>›</span>
                        {parentSlug ? (
                            <>
                                <Link href={`/${parentSlug}`} className={styles.bcLink}>
                                    {parentObj?.name || parentSlug}
                                </Link>
                                <span className={styles.bcSep}>›</span>
                                <span className={styles.bcCurrent}>{meta.label}</span>
                            </>
                        ) : (
                            <span className={styles.bcCurrent}>{meta.label}</span>
                        )}
                    </nav>

                    <div className={styles.headerRow}>
                        <div>
                            <h1 className={styles.h1}>{meta.h1}</h1>
                            <p className={styles.headerDesc}>{meta.desc}</p>
                        </div>
                        <div className={styles.resultCount}>
                            <span className={styles.countNum}>{totalCount}</span>
                            <span className={styles.countLabel}>sản phẩm</span>
                        </div>
                    </div>

                    {/* Sub-category tabs */}
                    {subCatTabs.length > 0 && (
                        <div className={styles.subCatTabs}>
                            <Link
                                href={`/${parentSlug || catSlug}`}
                                className={`${styles.subCatTab} ${!parentSlug ? styles.subCatTabActive : ''}`}
                            >
                                Tất cả
                            </Link>
                            {subCatTabs.map(tab => (
                                <Link
                                    key={tab._id}
                                    href={`/${tab.slug}`}
                                    className={`${styles.subCatTab} ${catSlug === tab.slug ? styles.subCatTabActive : ''}`}
                                >
                                    {tab.name}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── MAIN LAYOUT ── */}
            <div className={styles.body}>
                <div className={styles.bodyInner}>

                    <button className={styles.mobileFilterBtn} onClick={() => setSidebarMobile(true)}>
                        ⚙ Bộ lọc {activeCount > 0 && <span className={styles.filterBadge}>{activeCount}</span>}
                    </button>

                    {/* ── SIDEBAR ── */}
                    <aside className={`${styles.sidebar} ${sidebarMobile ? styles.sidebarOpen : ""}`}>
                        <button className={styles.sidebarClose} onClick={() => setSidebarMobile(false)}>✕</button>

                        <div className={styles.sidebarHead}>
                            <span className={styles.sidebarTitle}>BỘ LỌC</span>
                            {activeCount > 0 && (
                                <button className={styles.clearBtn} onClick={clearAll}>
                                    Xóa tất cả ({activeCount})
                                </button>
                            )}
                        </div>

                        <div className={styles.sidebarScroll}>
                            {/* Price Range */}
                            <div className={styles.filterGroup}>
                                <div className={styles.filterGroupLabel}>Giá tiền</div>
                                <div className={styles.priceDisplay}>
                                    <span className={styles.priceVal}>{formatPrice(priceRange[0])}</span>
                                    <span className={styles.priceDash}>—</span>
                                    <span className={styles.priceVal}>{formatPrice(priceRange[1])}</span>
                                </div>
                                <div className={styles.rangeWrap}>
                                    <input type="range" min={0} max={10_000_000} step={100_000} value={priceRange[0]} className={styles.rangeInput}
                                        onChange={(e) => { setPriceRange([+e.target.value, priceRange[1]]); setPage(1); }} />
                                    <input type="range" min={0} max={10_000_000} step={100_000} value={priceRange[1]} className={styles.rangeInput}
                                        onChange={(e) => { setPriceRange([priceRange[0], +e.target.value]); setPage(1); }} />
                                </div>
                                <div className={styles.rangeLabels}><span>0₫</span><span>10.000.000₫</span></div>
                            </div>

                            {/* Brands from API (cached) */}
                            <FilterDropdown
                                label="Thương hiệu"
                                options={brands}
                                selected={selectedBrands}
                                onChange={toggleBrand}
                            />

                            {/* Spec filters (cached) */}
                            {Object.entries(specFilters).map(([filterKey, options]) => (
                                <FilterDropdown
                                    key={filterKey}
                                    label={filterKey}
                                    options={options.map(o => ({ id: o.normalized, name: o.normalized }))}
                                    selected={selectedSpecs[filterKey] || new Set()}
                                    onChange={(val) => toggleSpec(filterKey, val)}
                                />
                            ))}
                        </div>

                        <div className={styles.filterActions}>
                            <Button variant="cyan" size="md" fullWidth onClick={() => setSidebarMobile(false)}>
                                ÁP DỤNG BỘ LỌC
                            </Button>
                            <Button variant="ghost" size="md" fullWidth onClick={clearAll}>
                                XÓA BỘ LỌC
                            </Button>
                        </div>
                    </aside>

                    {sidebarMobile && <div className={styles.sidebarOverlay} onClick={() => setSidebarMobile(false)} />}

                    {/* ── RIGHT CONTENT ── */}
                    <div className={styles.content}>
                        {/* TOOLBAR */}
                        <div className={styles.toolbar}>
                            <div className={styles.toolbarLeft}>
                                <span className={styles.toolbarCount}>
                                    Hiển thị <strong>{products.length}</strong> / {totalCount} sản phẩm
                                </span>
                            </div>
                            <div className={styles.toolbarRight}>
                                <div className={styles.sortWrap}>
                                    <label className={styles.sortLabel}>Sắp xếp:</label>
                                    <select className={styles.sortSelect} value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
                                        {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                                <div className={styles.viewToggle}>
                                    <button className={`${styles.viewBtn} ${view === "grid4" ? styles.viewBtnActive : ""}`} onClick={() => setView("grid4")} aria-label="Grid 4 cột">
                                        <span className={styles.viewIcon4}><span /><span /><span /><span /></span>
                                    </button>
                                    <button className={`${styles.viewBtn} ${view === "grid3" ? styles.viewBtnActive : ""}`} onClick={() => setView("grid3")} aria-label="Grid 3 cột">
                                        <span className={styles.viewIcon3}><span /><span /><span /></span>
                                    </button>
                                    <button className={`${styles.viewBtn} ${view === "list" ? styles.viewBtnActive : ""}`} onClick={() => setView("list")} aria-label="Danh sách">
                                        <span className={styles.viewIconList}><span /><span /><span /></span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Active filter tags */}
                        {activeCount > 0 && (
                            <div className={styles.activeTags}>
                                {Array.from(selectedBrands).map(bId => {
                                    const brand = brands.find((b: any) => b.id === bId);
                                    return (
                                        <button key={bId} className={styles.activeTag} onClick={() => toggleBrand(bId)}>
                                            {brand?.name || bId} ✕
                                        </button>
                                    );
                                })}
                                {Object.entries(selectedSpecs).flatMap(([key, vals]) =>
                                    Array.from(vals).map(val => (
                                        <button key={`${key}-${val}`} className={styles.activeTag} onClick={() => toggleSpec(key, val)}>
                                            {key}: {val} ✕
                                        </button>
                                    ))
                                )}
                                <button className={styles.clearTagsBtn} onClick={clearAll}>Xóa tất cả</button>
                            </div>
                        )}

                        {/* PRODUCT GRID */}
                        {loading ? (
                            <ProductGridSkeleton count={PRODUCTS_PER_PAGE} />
                        ) : products.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.4)' }}>
                                Không tìm thấy sản phẩm nào trong danh mục này.
                            </div>
                        ) : (
                            <div className={`${styles.productGrid} ${styles[`grid--${view}`]}`}>
                                {products.map((product: any) =>
                                    view === "list" ? (
                                        <div key={product._id} className={styles.listCard}>
                                            <div className={styles.listCardImage}>
                                                {product.images?.[0] ? (
                                                    <LazyImage
                                                        src={product.images[0]}
                                                        alt={product.name}
                                                        fill
                                                        objectFit="cover"
                                                        className={styles.listImg}
                                                    />
                                                ) : (
                                                    <div className={styles.listImageFallback}>📷</div>
                                                )}
                                                {product.tags?.includes("hot") && <span className={`${styles.listBadge} ${styles.badgeHot}`}>🔥 HOT</span>}
                                                {product.tags?.includes("new") && <span className={`${styles.listBadge} ${styles.badgeNew}`}>NEW</span>}
                                                {product.tags?.includes("sale") && product.salePrice && (
                                                    <span className={`${styles.listBadge} ${styles.badgeSale}`}>
                                                        -{Math.round((1 - product.salePrice / product.basePrice) * 100)}%
                                                    </span>
                                                )}
                                            </div>
                                            <div className={styles.listCardBody}>
                                                <div className={styles.listBrand}>{product.brand?.name || ''}</div>
                                                <h2 className={styles.listName}>{product.name}</h2>
                                                <div className={styles.listMeta}>
                                                    <span className={styles.listSku}>SKU: {product.sku}</span>
                                                    <span className={styles.listRating}>
                                                        ★ {(product.ratings?.avg || 0).toFixed(1)}
                                                        <span className={styles.listRatingCount}>({product.ratings?.count || 0})</span>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={styles.listCardPrice}>
                                                <span className={styles.listPrice}>
                                                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(product.salePrice ?? product.basePrice)}
                                                </span>
                                                {product.salePrice && (
                                                    <span className={styles.listOldPrice}>
                                                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(product.basePrice)}
                                                    </span>
                                                )}
                                                <Button variant="cyan" size="sm">🛒 Thêm vào giỏ</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <ProductCard key={product._id} product={product as any} onAddToCart={() => { }} />
                                    )
                                )}
                            </div>
                        )}

                        {/* PAGINATION */}
                        {totalPages > 1 && (
                            <div className={styles.pagination}>
                                <button className={`${styles.pageBtn} ${page === 1 ? styles.pageBtnDisabled : ""}`} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                                    .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                                        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                                        acc.push(p);
                                        return acc;
                                    }, [])
                                    .map((item, i) =>
                                        item === "..." ? (
                                            <span key={`ellipsis-${i}`} className={styles.pageEllipsis}>…</span>
                                        ) : (
                                            <button key={item} className={`${styles.pageBtn} ${page === item ? styles.pageBtnActive : ""}`} onClick={() => setPage(item as number)}>{item}</button>
                                        )
                                    )}
                                <button className={`${styles.pageBtn} ${page === totalPages ? styles.pageBtnDisabled : ""}`} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
                                <span className={styles.pageInfo}>Trang <strong>{page}</strong> / {totalPages}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
