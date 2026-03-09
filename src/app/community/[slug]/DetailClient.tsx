'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import ListingCard from '@/components/community/ListingCard';
import styles from './page.module.scss';

interface Seller {
    _id: string;
    name: string;
    image?: string;
}

interface Listing {
    _id: string;
    title: string;
    slug: string;
    price: number;
    images: string[];
    condition: string;
    category: string;
    description: string;
    location: string;
    views: number;
    status: string;
    contact: { phone?: string; zalo?: string };
    seller: Seller;
    createdAt: string;
}

const CONDITION_LABELS: Record<string, { label: string; color: string }> = {
    like_new: { label: 'Mới 99%', color: 'green' },
    used: { label: 'Đã sử dụng', color: 'gold' },
    warranty: { label: 'Còn bảo hành', color: 'cyan' },
    minor_defect: { label: 'Lỗi nhẹ', color: 'red' },
};

const CATEGORY_LABELS: Record<string, string> = {
    keyboard: 'Bàn phím', mouse: 'Chuột', headphone: 'Tai nghe',
    speaker: 'Loa', accessory: 'Phụ kiện', combo: 'Combo', other: 'Khác',
};

function formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ngày trước`;
    const months = Math.floor(days / 30);
    return `${months} tháng trước`;
}

export default function DetailClient() {
    const params = useParams();
    const { data: session } = useSession();
    const slug = params?.slug as string;

    const [listing, setListing] = useState<Listing | null>(null);
    const [related, setRelated] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [reportReason, setReportReason] = useState('');
    const [showReport, setShowReport] = useState(false);
    const [reporting, setReporting] = useState(false);
    const [reported, setReported] = useState(false);

    useEffect(() => {
        if (!slug) return;
        setLoading(true);
        fetch(`/api/community/${slug}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.success) {
                    setListing(data.data);
                    fetch(`/api/community?category=${data.data.category}&limit=4`)
                        .then((r) => r.json())
                        .then((rel) => {
                            if (rel.success) {
                                setRelated(rel.data.filter((l: Listing) => l._id !== data.data._id).slice(0, 3));
                            }
                        });
                }
            })
            .finally(() => setLoading(false));
    }, [slug]);

    const handleReport = async () => {
        if (!reportReason.trim()) return;
        setReporting(true);
        try {
            const res = await fetch(`/api/community/${listing?._id}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: reportReason }),
            });
            const data = await res.json();
            if (data.success) {
                setReported(true);
                setShowReport(false);
            }
        } finally {
            setReporting(false);
        }
    };

    if (loading) {
        return <div className={styles.loading}>Đang tải...</div>;
    }

    if (!listing) {
        return (
            <div className={styles.notFound}>
                <h2>Không tìm thấy tin đăng</h2>
                <Link href="/community">Quay lại</Link>
            </div>
        );
    }

    const cond = CONDITION_LABELS[listing.condition] || { label: listing.condition, color: 'gold' };
    const isSold = listing.status === 'sold';

    return (
        <div className={styles.page}>
            <div className={styles.breadcrumb}>
                <Link href="/community">Thanh lý</Link>
                <span>/</span>
                <span>{CATEGORY_LABELS[listing.category] || listing.category}</span>
            </div>

            <div className={styles.content}>
                {/* Image Gallery */}
                <div className={styles.gallery}>
                    <div className={styles.mainImage}>
                        {listing.images?.[activeImage] ? (
                            <Image
                                src={listing.images[activeImage]}
                                alt={listing.title}
                                fill
                                sizes="(max-width:768px) 100vw, 50vw"
                                className={styles.img}
                                unoptimized={!listing.images[activeImage].includes('res.cloudinary.com')}
                            />
                        ) : (
                            <div className={styles.imageFallback}>📷 Không có hình ảnh</div>
                        )}
                        {isSold && <div className={styles.soldOverlay}>ĐÃ BÁN</div>}
                    </div>
                    {listing.images.length > 1 && (
                        <div className={styles.thumbs}>
                            {listing.images.map((img, i) => (
                                <button
                                    key={i}
                                    className={`${styles.thumb} ${i === activeImage ? styles.thumbActive : ''}`}
                                    onClick={() => setActiveImage(i)}
                                >
                                    <Image src={img} alt="" fill sizes="80px" className={styles.thumbImg}
                                        unoptimized={!img.includes('res.cloudinary.com')} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className={styles.info}>
                    <div className={styles.tags}>
                        <span className={`${styles.condBadge} ${styles[`cond--${cond.color}`]}`}>{cond.label}</span>
                        <span className={styles.catBadge}>{CATEGORY_LABELS[listing.category] || listing.category}</span>
                    </div>

                    <h1 className={styles.title}>{listing.title}</h1>
                    <div className={styles.price}>{formatPrice(listing.price)}</div>

                    <div className={styles.meta}>
                        {listing.location && <span>📍 {listing.location}</span>}
                        <span>👁 {listing.views} lượt xem</span>
                        <span>🕒 {timeAgo(listing.createdAt)}</span>
                    </div>

                    <div className={styles.descSection}>
                        <h3 className={styles.sectionTitle}>Mô tả</h3>
                        <p className={styles.desc}>{listing.description}</p>
                    </div>

                    {/* Seller Card */}
                    <div className={styles.sellerCard}>
                        <div className={styles.sellerInfo}>
                            <div className={styles.sellerAvatar}>
                                {listing.seller?.image ? (
                                    <Image src={listing.seller.image} alt="" width={40} height={40} className={styles.avatarImg} />
                                ) : (
                                    <span>{listing.seller?.name?.[0] || '?'}</span>
                                )}
                            </div>
                            <div>
                                <div className={styles.sellerName}>{listing.seller?.name || 'Ẩn danh'}</div>
                                <div className={styles.sellerLabel}>Người bán</div>
                            </div>
                        </div>
                        <div className={styles.contactBtns}>
                            {listing.contact?.phone && (
                                <a href={`tel:${listing.contact.phone}`} className={styles.contactBtn}>
                                    📞 {listing.contact.phone}
                                </a>
                            )}
                            {listing.contact?.zalo && (
                                <a
                                    href={`https://zalo.me/${listing.contact.zalo}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`${styles.contactBtn} ${styles.zaloBtn}`}
                                >
                                    💬 Nhắn Zalo
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Report */}
                    {session && !reported && (
                        <div className={styles.reportSection}>
                            {!showReport ? (
                                <button className={styles.reportToggle} onClick={() => setShowReport(true)}>
                                    🚩 Báo cáo vi phạm
                                </button>
                            ) : (
                                <div className={styles.reportForm}>
                                    <textarea
                                        className={styles.reportInput}
                                        placeholder="Lý do báo cáo..."
                                        value={reportReason}
                                        onChange={(e) => setReportReason(e.target.value)}
                                        rows={3}
                                    />
                                    <div className={styles.reportActions}>
                                        <button className={styles.reportCancel} onClick={() => setShowReport(false)}>Huỷ</button>
                                        <button className={styles.reportSubmit} onClick={handleReport} disabled={reporting}>
                                            {reporting ? 'Đang gửi...' : 'Gửi báo cáo'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {reported && <div className={styles.reportedMsg}>Đã báo cáo. Cảm ơn bạn!</div>}
                </div>
            </div>

            {/* Related */}
            {related.length > 0 && (
                <div className={styles.related}>
                    <h2 className={styles.relatedTitle}>Tin đăng tương tự</h2>
                    <div className={styles.relatedGrid}>
                        {related.map((l) => (
                            <ListingCard key={l._id} listing={l} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
