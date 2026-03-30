'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '@/components/product/ProductCard';
import { CatalogPageSkeleton } from '@/components/ui/Skeleton';
import styles from './page.module.scss';
import { useToast } from '@/components/ui';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

// Interfaces matching our mongoose schemas
interface Category {
    _id: string;
    name: string;
}

interface Brand {
    _id: string;
    name: string;
}

interface Product {
    _id: string;
    name: string;
    slug: string;
    sku: string;
    brand: { name: string };
    basePrice: number;
    salePrice: number | null;
    images: string[];
    ratings?: { avg: number; count: number };
    tags: string[];
    stock: number;
}

const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function CatalogContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { error } = useToast();
    const siteSettings = useSiteSettings();

    // Filter States
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>(searchParams?.get('category') || '');
    const [selectedBrands, setSelectedBrands] = useState<string[]>(searchParams?.get('brand')?.split(',') || []);
    const [sort, setSort] = useState<string>(searchParams?.get('sort') || '-createdAt');
    const searchQuery = searchParams?.get('search') || '';
    const currentPage = Number(searchParams?.get('page') || 1);

    // ── REACT QUERY: Categories & Brands (cache 30 phút) ──
    const { data: categories = [] } = useQuery({
        queryKey: ['categories', 'list', {}],
        queryFn: () => fetch('/api/categories?limit=100').then(r => r.json()).then(d => d.success ? d.data : []),
        staleTime: 1000 * 60 * 30,
    });

    const { data: brands = [] } = useQuery({
        queryKey: ['brands', 'list', { hasProducts: true }],
        queryFn: () => fetch('/api/brands?limit=100&hasProducts=true').then(r => r.json()).then(d => d.success ? d.data : []),
        staleTime: 1000 * 60 * 30,
    });

    // ── REACT QUERY: Products (cache theo filter params) ──
    const productParams = {
        page: currentPage,
        limit: 12,
        active: 'true',
        ...(selectedCategory ? { category: selectedCategory } : {}),
        ...(selectedBrands.length > 0 ? { brand: selectedBrands.join(',') } : {}),
        ...(sort ? { sort } : {}),
        ...(searchQuery ? { search: searchQuery } : {}),
    };
    const productSp = new URLSearchParams(
        Object.entries(productParams).map(([k, v]) => [k, String(v)])
    );
    const { data: productResult, isPending: loading } = useQuery({
        queryKey: ['products', 'list', productParams],
        queryFn: () => fetch(`/api/products?${productSp}`).then(r => r.json()).then(d => ({
            data: d.success ? d.data : [],
            pagination: d.pagination ?? { page: 1, totalPages: 1, totalDocs: 0 },
        })),
        placeholderData: (prev) => prev,
    });

    const products = productResult?.data ?? [];
    const pagination = productResult?.pagination ?? { page: 1, totalPages: 1, totalDocs: 0 };

    // Show skeleton while first-load (no cached data yet)
    if (loading && products.length === 0) {
        return <CatalogPageSkeleton />;
    }

    // Handlers for Filters
    const handleBrandChange = (brandId: string) => {
        const nextBrands = selectedBrands.includes(brandId)
            ? selectedBrands.filter((id) => id !== brandId)
            : [...selectedBrands, brandId];
        setSelectedBrands(nextBrands);
        updateURL(1, selectedCategory, nextBrands, sort);
    };

    const handleCategoryChange = (catId: string) => {
        const nextCat = selectedCategory === catId ? '' : catId;
        setSelectedCategory(nextCat);
        updateURL(1, nextCat, selectedBrands, sort);
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const nextSort = e.target.value;
        setSort(nextSort);
        updateURL(1, selectedCategory, selectedBrands, nextSort);
    };

    const handlePageChange = (newPage: number) => {
        updateURL(newPage, selectedCategory, selectedBrands, sort);
    };

    const updateURL = (page: number, cat: string, brs: string[], srt: string) => {
        const query = new URLSearchParams();
        if (page > 1) query.append('page', page.toString());
        if (searchQuery) query.append('search', searchQuery);
        if (cat) query.append('category', cat);
        if (brs.length > 0) query.append('brand', brs.join(','));
        if (srt && srt !== '-createdAt') query.append('sort', srt);

        router.push(`/products?${query.toString()}`, { scroll: true });
    };

    return (
        <div className={styles.page}>
            {/* ── HERO BANNER ── */}
            <section className={styles.hero}>
                <div className={styles.heroGrid} />
                <div className={styles.heroGlow} />
                <motion.div
                    className={styles.heroContent}
                    initial="hidden"
                    animate="show"
                    variants={stagger}
                >
                    <motion.div className={styles.heroBadge} variants={fadeUp}>
                        <span className={styles.heroDot} />
                        DANH MỤC SẢN PHẨM
                    </motion.div>

                    <motion.h1 className={styles.heroTitle} variants={fadeUp}>
                        {searchQuery ? (
                            <>Kết quả cho &ldquo;<span className={styles.heroHighlight}>{searchQuery}</span>&rdquo;</>
                        ) : (
                            <>TẤT CẢ <span className={styles.heroGradientText}>SẢN PHẨM</span></>
                        )}
                    </motion.h1>

                    <motion.p className={styles.heroSub} variants={fadeUp}>
                        {`Danh mục thiết bị ngoại vi ${siteSettings.storeName} — Gaming gear chính hãng`}
                    </motion.p>

                    {/* Category Tabs */}
                    <motion.div className={styles.catTabs} variants={fadeUp}>
                        <button
                            className={`${styles.catTab} ${selectedCategory === '' ? styles.catTabActive : ''}`}
                            onClick={() => handleCategoryChange('')}
                        >
                            Tất cả
                        </button>
                        {categories.map((cat: any) => (
                            <button
                                key={cat._id}
                                className={`${styles.catTab} ${selectedCategory === cat._id ? styles.catTabActive : ''}`}
                                onClick={() => handleCategoryChange(cat._id === selectedCategory ? '' : cat._id)}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </motion.div>
                </motion.div>
            </section>

            <div className={styles.layout}>
                {/* Nút bật/tắt Lọc trên Mobile */}
                <button
                    className={styles.mobileFilterBtn}
                    onClick={() => setMobileFilterOpen(true)}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                    BỘ LỌC SẢN PHẨM
                </button>

                {/* Sidebar Overlay */}
                <AnimatePresence>
                    {mobileFilterOpen && (
                        <motion.div
                            className={styles.sidebarOverlay}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileFilterOpen(false)}
                        />
                    )}
                </AnimatePresence>

                {/* Sidebar Filters */}
                <aside
                    className={`${styles.sidebar} ${mobileFilterOpen ? styles.sidebarOpen : ''}`}
                >
                    <div className={styles.sidebarAccent} />
                    <div className={styles.sidebarHead}>
                        <h2 className={styles.sidebarTitle}>BỘ LỌC TÌM KIẾM</h2>
                        <button className={styles.sidebarClose} onClick={() => setMobileFilterOpen(false)}>
                            ✕
                        </button>
                    </div>

                    <div className={styles.sidebarScroll}>
                        <div className={styles.filterGroup}>
                            <h3 className={styles.filterTitle}>Thương hiệu</h3>
                            <div className={styles.filterList}>
                                {brands.map((brand: any) => (
                                    <label key={brand._id} className={styles.filterItem}>
                                        <input
                                            type="checkbox"
                                            checked={selectedBrands.includes(brand._id)}
                                            onChange={() => handleBrandChange(brand._id)}
                                        />
                                        <span>{brand.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className={styles.filterGroup}>
                            <h3 className={styles.filterTitle}>Mức giá</h3>
                            <div className={styles.filterList}>
                                <label className={styles.filterItem}><input type="radio" name="price" /> Dưới 1 triệu</label>
                                <label className={styles.filterItem}><input type="radio" name="price" /> Từ 1 - 2 triệu</label>
                                <label className={styles.filterItem}><input type="radio" name="price" /> Trên 2 triệu</label>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className={styles.main}>
                    <div className={styles.toolbar}>
                        <span className={styles.resultCount}>
                            Hiển thị <strong>{products.length}</strong> trên tổng <strong>{pagination.totalDocs}</strong> sản phẩm
                        </span>
                        <select className={styles.sortSelect} value={sort} onChange={handleSortChange}>
                            <option value="-createdAt">Mới nhất</option>
                            <option value="basePrice">Giá: Thấp đến cao</option>
                            <option value="-basePrice">Giá: Cao xuống thấp</option>
                            <option value="-soldCount">Bán chạy nhất</option>
                        </select>
                    </div>

                    {loading ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>⏳</div>
                            <div>Đang tải sản phẩm...</div>
                        </div>
                    ) : products.length > 0 ? (
                        <motion.div
                            className={styles.grid}
                            variants={stagger}
                            initial="hidden"
                            animate="show"
                            key={`${selectedCategory}-${selectedBrands.join(',')}-${sort}-${currentPage}`}
                        >
                            {products.map((p: any) => (
                                <motion.div key={p._id} variants={fadeUp}>
                                    <ProductCard
                                        product={p as any}
                                        onAddToCart={() => { }}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>🔍</div>
                            <div>Không tìm thấy sản phẩm nào phù hợp.</div>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                className={styles.pageBtn}
                                disabled={currentPage === 1}
                                onClick={() => handlePageChange(currentPage - 1)}
                            >
                                ‹
                            </button>

                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pg) => (
                                <button
                                    key={pg}
                                    className={`${styles.pageBtn} ${currentPage === pg ? styles.active : ''}`}
                                    onClick={() => handlePageChange(pg)}
                                >
                                    {pg}
                                </button>
                            ))}

                            <button
                                className={styles.pageBtn}
                                disabled={currentPage === pagination.totalPages}
                                onClick={() => handlePageChange(currentPage + 1)}
                            >
                                ›
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default function ProductCatalogPage() {
    return (
        <Suspense fallback={<div style={{ padding: '80px', textAlign: 'center', color: '#7A7870' }}>⏳ Đang tải...</div>}>
            <CatalogContent />
        </Suspense>
    );
}
