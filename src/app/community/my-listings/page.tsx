'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LazyImage from '@/components/ui/LazyImage';
import styles from './page.module.scss';

interface Listing {
    _id: string;
    title: string;
    slug: string;
    price: number;
    images: string[];
    condition: string;
    status: string;
    views: number;
    createdAt: string;
}

const CONDITION_LABELS: Record<string, string> = {
    like_new: 'Mới 99%', used: 'Đã sử dụng', warranty: 'Còn bảo hành', minor_defect: 'Lỗi nhẹ',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    active: { label: 'Đang bán', color: 'green' },
    sold: { label: 'Đã bán', color: 'gold' },
    hidden: { label: 'Ẩn', color: 'ink3' },
    reported: { label: 'Bị báo cáo', color: 'red' },
};

function formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

export default function MyListingsPage() {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();

    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');

    useEffect(() => {
        if (authStatus === 'unauthenticated') {
            router.push('/login');
            return;
        }
        if (authStatus !== 'authenticated') return;

        const fetchMyListings = async () => {
            setLoading(true);
            try {
                const query = new URLSearchParams();
                query.append('seller', 'me');
                query.append('limit', '50');
                if (filterStatus) query.append('status', filterStatus);

                const res = await fetch(`/api/community?${query.toString()}`);
                const data = await res.json();
                if (data.success) setListings(data.data);
            } finally {
                setLoading(false);
            }
        };

        fetchMyListings();
    }, [authStatus, filterStatus, router]);

    const handleMarkSold = async (id: string) => {
        const res = await fetch(`/api/community/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'sold' }),
        });
        const data = await res.json();
        if (data.success) {
            setListings((prev) => prev.map((l) => (l._id === id ? { ...l, status: 'sold' } : l)));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xoá tin đăng này?')) return;
        const res = await fetch(`/api/community/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            setListings((prev) => prev.filter((l) => l._id !== id));
        }
    };

    if (authStatus === 'loading' || (authStatus === 'authenticated' && loading)) {
        return <div className={styles.loading}>Đang tải...</div>;
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>BÀI ĐĂNG CỦA TÔI</h1>
                    <p className={styles.subtitle}>{listings.length} tin đăng</p>
                </div>
                <Link href="/community/new" className={styles.postBtn}>+ Đăng bán</Link>
            </div>

            <div className={styles.filters}>
                {['', 'active', 'sold', 'hidden'].map((s) => (
                    <button
                        key={s}
                        className={`${styles.filterBtn} ${filterStatus === s ? styles.filterActive : ''}`}
                        onClick={() => setFilterStatus(s)}
                    >
                        {s === '' ? 'Tất cả' : STATUS_LABELS[s]?.label || s}
                    </button>
                ))}
            </div>

            {listings.length === 0 ? (
                <div className={styles.empty}>
                    <span style={{ fontSize: '48px' }}>📦</span>
                    <p>Chưa có tin đăng nào</p>
                    <Link href="/community/new" className={styles.emptyBtn}>Đăng bán ngay</Link>
                </div>
            ) : (
                <div className={styles.list}>
                    {listings.map((listing) => {
                        const st = STATUS_LABELS[listing.status] || STATUS_LABELS.active;
                        return (
                            <div key={listing._id} className={styles.card}>
                                <Link href={`/community/${listing.slug}`} className={styles.cardImage}>
                                    {listing.images?.[0] ? (
                                        <LazyImage src={listing.images[0]} alt="" fill objectFit="cover" className={styles.cardImg}
                                             />
                                    ) : (
                                        <span className={styles.cardImgFallback}>📷</span>
                                    )}
                                </Link>

                                <div className={styles.cardBody}>
                                    <div className={styles.cardTop}>
                                        <Link href={`/community/${listing.slug}`} className={styles.cardTitle}>
                                            {listing.title}
                                        </Link>
                                        <span className={`${styles.statusBadge} ${styles[`status--${st.color}`]}`}>{st.label}</span>
                                    </div>
                                    <div className={styles.cardMeta}>
                                        <span className={styles.cardPrice}>{formatPrice(listing.price)}</span>
                                        <span>{CONDITION_LABELS[listing.condition]}</span>
                                        <span>👁 {listing.views}</span>
                                    </div>
                                </div>

                                <div className={styles.cardActions}>
                                    {listing.status === 'active' && (
                                        <button className={styles.actionBtn} onClick={() => handleMarkSold(listing._id)}>
                                            Đã bán
                                        </button>
                                    )}
                                    <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(listing._id)}>
                                        Xoá
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
