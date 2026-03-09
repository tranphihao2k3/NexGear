'use client';
import Image from 'next/image';
import Link from 'next/link';
import styles from './ListingCard.module.scss';

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

const CONDITION_LABELS: Record<string, { label: string; color: string }> = {
    like_new: { label: 'Mới 99%', color: 'green' },
    used: { label: 'Đã sử dụng', color: 'gold' },
    warranty: { label: 'Còn bảo hành', color: 'cyan' },
    minor_defect: { label: 'Lỗi nhẹ', color: 'red' },
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

export default function ListingCard({ listing }: { listing: Listing }) {
    const cond = CONDITION_LABELS[listing.condition] || { label: listing.condition, color: 'gold' };
    const isSold = listing.status === 'sold';

    return (
        <article className={`${styles.card} ${isSold ? styles.cardSold : ''}`}>
            <Link href={`/community/${listing.slug}`} className={styles.imageWrap}>
                <div className={styles.image}>
                    {listing.images?.[0] ? (
                        <Image
                            src={listing.images[0]}
                            alt={listing.title}
                            fill
                            sizes="(max-width:768px) 50vw, 25vw"
                            className={styles.img}
                            unoptimized={!listing.images[0].includes('res.cloudinary.com')}
                        />
                    ) : (
                        <div className={styles.imageFallback}>📷</div>
                    )}
                </div>

                <div className={styles.badges}>
                    <span className={`${styles.condBadge} ${styles[`cond--${cond.color}`]}`}>
                        {cond.label}
                    </span>
                    {isSold && <span className={styles.soldBadge}>ĐÃ BÁN</span>}
                </div>
            </Link>

            <div className={styles.body}>
                <Link href={`/community/${listing.slug}`} className={styles.bodyLink}>
                    <h3 className={styles.title}>{listing.title}</h3>
                    <div className={styles.price}>{formatPrice(listing.price)}</div>
                </Link>

                <div className={styles.meta}>
                    <div className={styles.seller}>
                        <div className={styles.sellerAvatar}>
                            {listing.seller?.image ? (
                                <Image src={listing.seller.image} alt="" width={20} height={20} className={styles.avatarImg} />
                            ) : (
                                <span>{listing.seller?.name?.[0] || '?'}</span>
                            )}
                        </div>
                        <span className={styles.sellerName}>{listing.seller?.name || 'Anonymous'}</span>
                    </div>

                    <div className={styles.metaRow}>
                        {listing.location && (
                            <span className={styles.metaItem}>📍 {listing.location}</span>
                        )}
                        <span className={styles.metaItem}>👁 {listing.views}</span>
                        <span className={styles.metaItem}>{timeAgo(listing.createdAt)}</span>
                    </div>
                </div>
            </div>
        </article>
    );
}
