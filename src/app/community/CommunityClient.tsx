'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ListingCard from '@/components/community/ListingCard';
import { Button } from '@/components/ui';
import styles from './page.module.scss';

const CATEGORIES = [
    { value: 'keyboard', label: 'Bàn phím' },
    { value: 'mouse', label: 'Chuột' },
    { value: 'headphone', label: 'Tai nghe' },
    { value: 'speaker', label: 'Loa' },
    { value: 'accessory', label: 'Phụ kiện' },
    { value: 'combo', label: 'Combo' },
    { value: 'other', label: 'Khác' },
];

const CONDITIONS = [
    { value: 'like_new', label: 'Mới 99%' },
    { value: 'used', label: 'Đã sử dụng' },
    { value: 'warranty', label: 'Còn bảo hành' },
    { value: 'minor_defect', label: 'Lỗi nhẹ' },
];

const SORT_OPTIONS = [
    { value: '-createdAt', label: 'Mới nhất' },
    { value: 'price', label: 'Giá: Thấp đến cao' },
    { value: '-price', label: 'Giá: Cao xuống thấp' },
    { value: '-views', label: 'Xem nhiều nhất' },
];

// Gợi ý tìm kiếm phổ biến
const SEARCH_SUGGESTIONS = [
    'Keychron', 'Razer', 'Logitech', 'Leopold', 'Ducky',
    'Bàn phím cơ', 'Chuột gaming', 'Tai nghe bluetooth',
    'Cherry MX', 'Gateron', 'Holy Panda',
    'Mouse pad', 'Keycap set', 'Wrist rest',
];

interface Listing {
    _id: string;
    title: string;
    slug: string;
    price: number;
    images: string[];
    condition: string;
    category: string;
    location: string;
    views: number;
    status: string;
    seller: { _id: string; name: string; image?: string };
    createdAt: string;
}

// Bỏ dấu tiếng Việt để so sánh tìm kiếm
function removeVietnameseTones(str: string): string {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase();
}

function CommunityContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalDocs: 0 });

    const [selectedCategory, setSelectedCategory] = useState(searchParams?.get('category') || '');
    const [selectedCondition, setSelectedCondition] = useState(searchParams?.get('condition') || '');
    const [sort, setSort] = useState(searchParams?.get('sort') || '-createdAt');
    const searchQuery = searchParams?.get('search') || '';
    const currentPage = Number(searchParams?.get('page') || 1);

    // Smart search state
    const [searchInput, setSearchInput] = useState(searchQuery);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const searchRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Close suggestions on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Filter suggestions khi user gõ
    const handleSearchInput = useCallback((val: string) => {
        setSearchInput(val);
        if (val.trim().length > 0) {
            const normalized = removeVietnameseTones(val);
            const matches = SEARCH_SUGGESTIONS.filter((s) =>
                removeVietnameseTones(s).includes(normalized)
            );
            setFilteredSuggestions(matches.slice(0, 5));
            setShowSuggestions(matches.length > 0);
        } else {
            setFilteredSuggestions([]);
            setShowSuggestions(false);
        }

        // Debounce auto-search: 500ms sau khi user ngừng gõ
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            updateURLWithSearch(1, selectedCategory, selectedCondition, sort, val.trim());
        }, 500);
    }, [selectedCategory, selectedCondition, sort]);

    const handleSuggestionClick = (suggestion: string) => {
        setSearchInput(suggestion);
        setShowSuggestions(false);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        updateURLWithSearch(1, selectedCategory, selectedCondition, sort, suggestion);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowSuggestions(false);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        updateURLWithSearch(1, selectedCategory, selectedCondition, sort, searchInput.trim());
    };

    const clearSearch = () => {
        setSearchInput('');
        setShowSuggestions(false);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        updateURLWithSearch(1, selectedCategory, selectedCondition, sort, '');
    };

    useEffect(() => {
        const fetchListings = async () => {
            setLoading(true);
            try {
                const query = new URLSearchParams();
                query.append('page', currentPage.toString());
                query.append('limit', '12');

                if (selectedCategory) query.append('category', selectedCategory);
                if (selectedCondition) query.append('condition', selectedCondition);
                if (sort) query.append('sort', sort);
                if (searchQuery) query.append('search', searchQuery);

                const res = await fetch(`/api/community?${query.toString()}`);
                const data = await res.json();

                if (data.success) {
                    setListings(data.data);
                    setPagination(data.pagination);
                }
            } catch {
                // silent
            } finally {
                setLoading(false);
            }
        };

        fetchListings();
    }, [currentPage, selectedCategory, selectedCondition, sort, searchQuery]);

    const updateURLWithSearch = (page: number, cat: string, cond: string, srt: string, search: string) => {
        const query = new URLSearchParams();
        if (page > 1) query.append('page', page.toString());
        if (search) query.append('search', search);
        if (cat) query.append('category', cat);
        if (cond) query.append('condition', cond);
        if (srt && srt !== '-createdAt') query.append('sort', srt);
        router.push(`/community?${query.toString()}`, { scroll: false });
    };

    const updateURL = (page: number, cat: string, cond: string, srt: string) => {
        updateURLWithSearch(page, cat, cond, srt, searchInput.trim());
    };

    const handleCategoryChange = (val: string) => {
        const next = selectedCategory === val ? '' : val;
        setSelectedCategory(next);
        updateURL(1, next, selectedCondition, sort);
    };

    const handleConditionChange = (val: string) => {
        const next = selectedCondition === val ? '' : val;
        setSelectedCondition(next);
        updateURL(1, selectedCategory, next, sort);
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const next = e.target.value;
        setSort(next);
        updateURL(1, selectedCategory, selectedCondition, next);
    };

    const handlePageChange = (newPage: number) => {
        updateURL(newPage, selectedCategory, selectedCondition, sort);
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>THANH LÝ CỘNG ĐỒNG</h1>
                    <p className={styles.subtitle}>Mua bán thanh lý gaming gear đã qua sử dụng</p>
                </div>
                <Link href="/community/new" className={styles.postBtn}>
                    + Đăng bán
                </Link>
            </div>

            {/* Thanh tìm kiếm thông minh */}
            <div className={styles.searchSection} ref={searchRef}>
                <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
                    <span className={styles.searchIcon}>🔍</span>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Tìm kiếm sản phẩm... VD: Keychron, chuột gaming, tai nghe..."
                        value={searchInput}
                        onChange={(e) => handleSearchInput(e.target.value)}
                        onFocus={() => {
                            if (filteredSuggestions.length > 0) setShowSuggestions(true);
                        }}
                    />
                    {searchInput && (
                        <button type="button" className={styles.searchClear} onClick={clearSearch}>✕</button>
                    )}
                    <Button type="submit" variant="cyan" size="md">Tìm</Button>
                </form>
                {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className={styles.suggestions}>
                        {filteredSuggestions.map((s) => (
                            <button
                                key={s}
                                className={styles.suggestionItem}
                                onClick={() => handleSuggestionClick(s)}
                            >
                                <span className={styles.suggestionIcon}>🔍</span>
                                {s}
                            </button>
                        ))}
                    </div>
                )}
                {/* Quick tags */}
                {!searchQuery && (
                    <div className={styles.quickTags}>
                        {['Bàn phím cơ', 'Chuột gaming', 'Keycap', 'Tai nghe'].map((tag) => (
                            <button
                                key={tag}
                                className={styles.quickTag}
                                onClick={() => handleSuggestionClick(tag)}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.layout}>
                <aside className={styles.sidebar}>
                    <div className={styles.filterGroup}>
                        <h3 className={styles.filterTitle}>Danh mục</h3>
                        <div className={styles.filterList}>
                            {CATEGORIES.map((cat) => (
                                <label key={cat.value} className={styles.filterItem}>
                                    <input
                                        type="radio"
                                        name="category"
                                        checked={selectedCategory === cat.value}
                                        onChange={() => handleCategoryChange(cat.value)}
                                        onClick={(e) => {
                                            if (selectedCategory === cat.value) {
                                                e.preventDefault();
                                                handleCategoryChange(cat.value);
                                            }
                                        }}
                                    />
                                    <span>{cat.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className={styles.filterGroup}>
                        <h3 className={styles.filterTitle}>Tình trạng</h3>
                        <div className={styles.filterList}>
                            {CONDITIONS.map((c) => (
                                <label key={c.value} className={styles.filterItem}>
                                    <input
                                        type="radio"
                                        name="condition"
                                        checked={selectedCondition === c.value}
                                        onChange={() => handleConditionChange(c.value)}
                                        onClick={(e) => {
                                            if (selectedCondition === c.value) {
                                                e.preventDefault();
                                                handleConditionChange(c.value);
                                            }
                                        }}
                                    />
                                    <span>{c.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </aside>

                <main className={styles.main}>
                    <div className={styles.toolbar}>
                        <span className={styles.resultCount}>
                            {searchQuery && <><strong>&quot;{searchQuery}&quot;</strong> — </>}
                            {pagination.totalDocs} tin đăng
                        </span>
                        <select className={styles.sortSelect} value={sort} onChange={handleSortChange}>
                            {SORT_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>

                    {loading ? (
                        <div className={styles.emptyState}>Đang tải...</div>
                    ) : listings.length > 0 ? (
                        <div className={styles.grid}>
                            {listings.map((listing) => (
                                <ListingCard key={listing._id} listing={listing} />
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <span style={{ fontSize: '48px' }}>📦</span>
                            {searchQuery ? (
                                <div>Không tìm thấy kết quả cho &quot;{searchQuery}&quot;</div>
                            ) : (
                                <div>Chưa có tin đăng nào.</div>
                            )}
                            <Link href="/community/new" className={styles.postBtnSmall}>Đăng bán ngay</Link>
                        </div>
                    )}

                    {pagination.totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                className={styles.pageBtn}
                                disabled={currentPage === 1}
                                onClick={() => handlePageChange(currentPage - 1)}
                            >
                                Trang trước
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
                                Trang sau
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default function CommunityClient() {
    return (
        <Suspense fallback={<div style={{ padding: '80px', textAlign: 'center', color: '#7A7870' }}>Đang tải...</div>}>
            <CommunityContent />
        </Suspense>
    );
}
