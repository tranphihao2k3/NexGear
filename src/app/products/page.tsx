'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/product/ProductCard';
import styles from './page.module.scss';
import { useToast } from '@/components/ui';

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

function CatalogContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { error } = useToast();

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);

    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalDocs: 0 });

    // Filter States
    const [selectedCategory, setSelectedCategory] = useState<string>(searchParams?.get('category') || '');
    const [selectedBrands, setSelectedBrands] = useState<string[]>(searchParams?.get('brand')?.split(',') || []);
    const [sort, setSort] = useState<string>(searchParams?.get('sort') || '-createdAt');
    const searchQuery = searchParams?.get('search') || '';
    const currentPage = Number(searchParams?.get('page') || 1);

    // Initial Data Fetch
    useEffect(() => {
        Promise.all([
            fetch('/api/categories?limit=100').then((r) => r.json()),
            fetch('/api/brands?limit=100&hasProducts=true').then((r) => r.json()),
        ]).then(([catData, brandData]) => {
            if (catData.success) setCategories(catData.data);
            if (brandData.success) setBrands(brandData.data);
        });
    }, []);

    // Fetch Products based on filters
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const query = new URLSearchParams();
                query.append('page', currentPage.toString());
                query.append('limit', '12'); // 12 per page
                query.append('active', 'true');

                if (selectedCategory) query.append('category', selectedCategory);
                if (selectedBrands.length > 0) query.append('brand', selectedBrands.join(','));
                if (sort) query.append('sort', sort);
                if (searchQuery) query.append('search', searchQuery);

                const res = await fetch(`/api/products?${query.toString()}`);
                const data = await res.json();

                if (data.success) {
                    setProducts(data.data);
                    setPagination(data.pagination);
                } else {
                    error(data.error);
                }
            } catch (err) {
                error("Lỗi kết nối máy chủ");
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [currentPage, selectedCategory, selectedBrands, sort, searchQuery, error]);

    // Handlers for Filters
    const handleBrandChange = (brandId: string) => {
        const nextBrands = selectedBrands.includes(brandId)
            ? selectedBrands.filter((id) => id !== brandId)
            : [...selectedBrands, brandId];
        setSelectedBrands(nextBrands);
        updateURL(1, selectedCategory, nextBrands, sort);
    };

    const handleCategoryChange = (catId: string) => {
        // toggle off if already selected
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

            <div className={styles.header}>
                <h1 className={styles.title}>
                    {searchQuery ? `Kết quả cho "${searchQuery}"` : 'Tất cả Sản phẩm'}
                </h1>
                <div className={styles.subtitle}>Danh mục thiết bị ngoại vi NEXGEAR</div>
            </div>

            <div className={styles.layout}>
                {/* Sidebar Filters */}
                <aside className={styles.sidebar}>
                    <div className={styles.filterGroup}>
                        <h3 className={styles.filterTitle}>Danh mục</h3>
                        <div className={styles.filterList}>
                            {categories.map((cat) => (
                                <label key={cat._id} className={styles.filterItem}>
                                    <input
                                        type="radio"
                                        name="category"
                                        checked={selectedCategory === cat._id}
                                        onChange={() => handleCategoryChange(cat._id)}
                                        onClick={(e) => {
                                            if (selectedCategory === cat._id) {
                                                e.preventDefault();
                                                handleCategoryChange(cat._id);
                                            }
                                        }}
                                    />
                                    <span>{cat.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className={styles.filterGroup}>
                        <h3 className={styles.filterTitle}>Thương hiệu</h3>
                        <div className={styles.filterList}>
                            {brands.map((brand) => (
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
                </aside>

                {/* Main Content */}
                <main className={styles.main}>
                    <div className={styles.toolbar}>
                        <span className={styles.resultCount}>
                            Hiển thị {products.length} trên tổng {pagination.totalDocs} sản phẩm
                        </span>
                        <select className={styles.sortSelect} value={sort} onChange={handleSortChange}>
                            <option value="-createdAt">Mới nhất</option>
                            <option value="basePrice">Giá: Thấp đến cao</option>
                            <option value="-basePrice">Giá: Cao xuống thấp</option>
                            <option value="-soldCount">Bán chạy nhất</option>
                        </select>
                    </div>

                    {loading ? (
                        <div className={styles.emptyState}>⏳ Đang tải sản phẩm...</div>
                    ) : products.length > 0 ? (
                        <div className={styles.grid}>
                            {products.map((p) => (
                                <ProductCard
                                    key={p._id}
                                    product={p as any}
                                    onAddToCart={() => { }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <span style={{ fontSize: '48px' }}>🔍</span>
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
                                Trang trước
                            </button>

                            {/* Simplistic page numbers array */}
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
                                Trang sau
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
