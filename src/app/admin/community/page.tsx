'use client';

import { useState, useEffect } from 'react';
import LazyImage from '@/components/ui/LazyImage';
import styles from './page.module.scss';
import { useToast } from '@/components/ui';

interface Listing {
    _id: string;
    title: string;
    slug: string;
    price: number;
    images: string[];
    condition: string;
    category: string;
    status: string;
    views: number;
    reportCount: number;
    seller: { _id: string; name: string };
    createdAt: string;
}

const CONDITION_LABELS: Record<string, string> = {
    like_new: 'Mới 99%', used: 'Đã SD', warranty: 'Bảo hành', minor_defect: 'Lỗi nhẹ',
};

const CATEGORY_LABELS: Record<string, string> = {
    keyboard: 'Bàn phím', mouse: 'Chuột', headphone: 'Tai nghe',
    speaker: 'Loa', accessory: 'Phụ kiện', combo: 'Combo', other: 'Khác',
};

const STATUS_OPTIONS = [
    { value: '', label: 'Tất cả' },
    { value: 'active', label: 'Đang bán' },
    { value: 'sold', label: 'Đã bán' },
    { value: 'hidden', label: 'Ẩn' },
    { value: 'reported', label: 'Bị báo cáo' },
];

function formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('vi-VN');
}

export default function AdminCommunityPage() {
    const { success, error } = useToast();

    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [reportedOnly, setReportedOnly] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ totalPages: 1, totalDocs: 0 });

    const fetchListings = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams();
            query.append('page', page.toString());
            query.append('limit', '20');
            if (statusFilter) query.append('status', statusFilter);
            else query.append('status', 'all');
            if (search) query.append('search', search);

            const res = await fetch(`/api/community?${query.toString()}`);
            const data = await res.json();
            if (data.success) {
                let items = data.data;
                if (reportedOnly) items = items.filter((l: Listing) => l.reportCount > 0);
                setListings(items);
                setPagination(data.pagination);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchListings(); }, [page, statusFilter, reportedOnly]);

    const handleSearch = () => {
        setPage(1);
        fetchListings();
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/community/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                success('Cập nhật trạng thái thành công');
                setListings((prev) =>
                    prev.map((l) => (l._id === id ? { ...l, status: newStatus } : l))
                );
            } else {
                error(data.error);
            }
        } catch {
            error('Lỗi kết nối');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Xác nhận xoá tin đăng này?')) return;
        try {
            const res = await fetch(`/api/community/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                success('Đã xoá tin đăng');
                setListings((prev) => prev.filter((l) => l._id !== id));
            } else {
                error(data.error);
            }
        } catch {
            error('Lỗi kết nối');
        }
    };

    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>THANH LÝ CỘNG ĐỒNG</h1>
                    <div className={styles.subtitle}>{pagination.totalDocs} tin đăng</div>
                </div>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchBox}>
                    <span className={styles.searchIcon}>🔍</span>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Tìm kiếm tin đăng..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                {STATUS_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        className={`${styles.filterBtn} ${statusFilter === opt.value ? styles.filterActive : ''}`}
                        onClick={() => { setStatusFilter(opt.value); setPage(1); }}
                    >
                        {opt.label}
                    </button>
                ))}
                <button
                    className={`${styles.filterBtn} ${reportedOnly ? styles.filterActive : ''}`}
                    onClick={() => { setReportedOnly(!reportedOnly); setPage(1); }}
                >
                    🚩 Báo cáo
                </button>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>TIN ĐĂNG</th>
                            <th>NGƯỜI BÁN</th>
                            <th>DANH MỤC</th>
                            <th>GIÁ</th>
                            <th>TRẠNG THÁI</th>
                            <th>BÁO CÁO</th>
                            <th>NGÀY ĐĂNG</th>
                            <th>THAO TÁC</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>Đang tải...</td></tr>
                        ) : listings.length === 0 ? (
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>Không có tin đăng</td></tr>
                        ) : (
                            listings.map((listing) => (
                                <tr key={listing._id}>
                                    <td>
                                        <div className={styles.productCell}>
                                            <div className={styles.productImage}>
                                                {listing.images?.[0] ? (
                                                    <LazyImage src={listing.images[0]} alt="" fill objectFit="cover" />
                                                ) : '📷'}
                                            </div>
                                            <div className={styles.productInfo}>
                                                <div className={styles.productName}>{listing.title}</div>
                                                <div className={styles.productSku}>
                                                    {CONDITION_LABELS[listing.condition]}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{listing.seller?.name || '—'}</td>
                                    <td>{CATEGORY_LABELS[listing.category] || listing.category}</td>
                                    <td className={styles.price}>{formatPrice(listing.price)}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${styles[`st--${listing.status}`]}`}>
                                            {STATUS_OPTIONS.find((s) => s.value === listing.status)?.label || listing.status}
                                        </span>
                                    </td>
                                    <td>
                                        {listing.reportCount > 0 && (
                                            <span className={styles.reportBadge}>🚩 {listing.reportCount}</span>
                                        )}
                                    </td>
                                    <td>{formatDate(listing.createdAt)}</td>
                                    <td>
                                        <div className={styles.rowActions}>
                                            {listing.status === 'active' ? (
                                                <button
                                                    className={styles.rowActionBtn}
                                                    title="Ẩn"
                                                    onClick={() => handleStatusChange(listing._id, 'hidden')}
                                                >
                                                    👁‍🗨
                                                </button>
                                            ) : listing.status === 'hidden' || listing.status === 'reported' ? (
                                                <button
                                                    className={styles.rowActionBtn}
                                                    title="Hiện lại"
                                                    onClick={() => handleStatusChange(listing._id, 'active')}
                                                >
                                                    ✅
                                                </button>
                                            ) : null}
                                            <button
                                                className={`${styles.rowActionBtn} ${styles.danger}`}
                                                title="Xoá"
                                                onClick={() => handleDelete(listing._id)}
                                            >
                                                🗑
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pagination.totalPages > 1 && (
                <div className={styles.pagination}>
                    <span className={styles.pageInfo}>
                        Trang {page} / {pagination.totalPages}
                    </span>
                    <div className={styles.pageButtons}>
                        <button
                            className={styles.pageBtn}
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                        >
                            ←
                        </button>
                        <button
                            className={styles.pageBtn}
                            disabled={page === pagination.totalPages}
                            onClick={() => setPage(page + 1)}
                        >
                            →
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
