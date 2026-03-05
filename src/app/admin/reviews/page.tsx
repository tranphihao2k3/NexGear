// ============================================================
// NEXGEAR — Admin Reviews Page
// List, approve/reject, delete reviews
// ============================================================
'use client'

import { useState, useEffect, useCallback } from 'react'
import styles from './page.module.scss'
import { CyberpunkLoader, useToast } from '@/components/ui'

interface ReviewUser {
    _id: string
    name: string
    image?: string
}

interface ReviewProduct {
    _id: string
    name: string
    slug: string
    images: string[]
}

interface Review {
    _id: string
    product: ReviewProduct | string
    user: ReviewUser | string
    rating: number
    title: string
    content: string
    images: string[]
    pros: string[]
    cons: string[]
    isVerified: boolean
    isApproved: boolean
    createdAt: string
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('vi-VN')
}

function renderStars(rating: number) {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

export default function AdminReviewsPage() {
    const { success, error } = useToast()
    const [reviews, setReviews] = useState<Review[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all') // all | pending | approved | rejected
    const [selectedReview, setSelectedReview] = useState<Review | null>(null)

    const fetchReviews = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ limit: '50' })
            if (filter === 'pending') params.set('approved', 'false')
            if (filter === 'approved') params.set('approved', 'true')

            const res = await fetch(`/api/reviews?${params}`)
            const json = await res.json()
            if (json.success) {
                setReviews(json.data)
                setTotal(json.pagination?.total || json.data.length)
            }
        } catch (err) {
            console.error('Failed to fetch reviews:', err)
        } finally {
            setLoading(false)
        }
    }, [filter])

    useEffect(() => {
        fetchReviews()
    }, [fetchReviews])

    const handleApprove = async (id: string, approve: boolean) => {
        try {
            const res = await fetch(`/api/reviews/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isApproved: approve }),
            })
            const data = await res.json()
            if (data.success) {
                success(approve ? 'Đã duyệt đánh giá' : 'Đã ẩn đánh giá')
                setReviews((prev) =>
                    prev.map((r) => (r._id === id ? { ...r, isApproved: approve } : r))
                )
                if (selectedReview?._id === id) {
                    setSelectedReview({ ...selectedReview, isApproved: approve })
                }
            }
        } catch {
            error('Lỗi cập nhật')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa đánh giá này vĩnh viễn?')) return
        try {
            const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' })
            const data = await res.json()
            if (data.success) {
                success('Đã xóa đánh giá')
                if (selectedReview?._id === id) setSelectedReview(null)
                fetchReviews()
            } else {
                error(data.error)
            }
        } catch {
            error('Lỗi xóa')
        }
    }

    const pendingCount = reviews.filter((r) => !r.isApproved).length

    return (
        <div>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Đánh giá sản phẩm</h1>
                    <div className={styles.subtitle}>{total} đánh giá</div>
                </div>
                {pendingCount > 0 && (
                    <div className={styles.pendingBadge}>
                        {pendingCount} chờ duyệt
                    </div>
                )}
            </div>

            {/* Filter tabs */}
            <div className={styles.filterTabs}>
                {[
                    { key: 'all', label: 'Tất cả' },
                    { key: 'pending', label: 'Chờ duyệt' },
                    { key: 'approved', label: 'Đã duyệt' },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        className={`${styles.filterTab} ${filter === tab.key ? styles.active : ''}`}
                        onClick={() => setFilter(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className={styles.contentLayout}>
                {/* Reviews List */}
                <div className={styles.reviewList}>
                    {loading ? (
                        <CyberpunkLoader message="Đang tải đánh giá..." compact />
                    ) : reviews.length === 0 ? (
                        <div className={styles.emptyState}>Không có đánh giá nào</div>
                    ) : (
                        reviews.map((review) => {
                            const product = typeof review.product === 'object' ? review.product : null
                            const user = typeof review.user === 'object' ? review.user : null
                            return (
                                <div
                                    key={review._id}
                                    className={`${styles.reviewCard} ${selectedReview?._id === review._id ? styles.selected : ''} ${!review.isApproved ? styles.pending : ''}`}
                                    onClick={() => setSelectedReview(review)}
                                >
                                    <div className={styles.reviewCardHeader}>
                                        <div className={styles.reviewUser}>
                                            <div className={styles.reviewAvatar}>
                                                {user?.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <div className={styles.reviewUserName}>{user?.name || 'Ẩn danh'}</div>
                                                <div className={styles.reviewDate}>{formatDate(review.createdAt)}</div>
                                            </div>
                                        </div>
                                        <div className={styles.reviewMeta}>
                                            <span className={`${styles.stars} ${styles[`r${review.rating}`]}`}>
                                                {renderStars(review.rating)}
                                            </span>
                                            {review.isVerified && <span className={styles.verifiedBadge}>Đã mua</span>}
                                        </div>
                                    </div>
                                    <div className={styles.reviewProduct}>
                                        {product?.name || 'Sản phẩm'}
                                    </div>
                                    {review.title && <div className={styles.reviewTitle}>{review.title}</div>}
                                    <div className={styles.reviewContent}>
                                        {review.content ? (review.content.length > 120 ? review.content.slice(0, 120) + '...' : review.content) : 'Không có nội dung'}
                                    </div>
                                    <div className={styles.reviewCardFooter}>
                                        <span className={`${styles.approvalBadge} ${review.isApproved ? styles.approved : styles.unapproved}`}>
                                            {review.isApproved ? '✓ Đã duyệt' : '⏳ Chờ duyệt'}
                                        </span>
                                        <div className={styles.quickActions}>
                                            {!review.isApproved && (
                                                <button
                                                    className={`${styles.quickBtn} ${styles.approve}`}
                                                    onClick={(e) => { e.stopPropagation(); handleApprove(review._id, true) }}
                                                >
                                                    ✓
                                                </button>
                                            )}
                                            {review.isApproved && (
                                                <button
                                                    className={`${styles.quickBtn} ${styles.reject}`}
                                                    onClick={(e) => { e.stopPropagation(); handleApprove(review._id, false) }}
                                                >
                                                    ✕
                                                </button>
                                            )}
                                            <button
                                                className={`${styles.quickBtn} ${styles.delete}`}
                                                onClick={(e) => { e.stopPropagation(); handleDelete(review._id) }}
                                            >
                                                🗑
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Review Detail Sidebar */}
                <div className={styles.detailSidebar}>
                    {selectedReview ? (() => {
                        const product = typeof selectedReview.product === 'object' ? selectedReview.product : null
                        const user = typeof selectedReview.user === 'object' ? selectedReview.user : null
                        return (
                            <>
                                <div className={styles.detailHeader}>
                                    <span className={`${styles.stars} ${styles[`r${selectedReview.rating}`]}`} style={{ fontSize: '20px' }}>
                                        {renderStars(selectedReview.rating)}
                                    </span>
                                    <span className={styles.ratingText}>{selectedReview.rating}/5</span>
                                </div>

                                <div className={styles.detailSection}>
                                    <div className={styles.detailLabel}>Sản phẩm</div>
                                    <div className={styles.detailValue}>{product?.name || '---'}</div>
                                </div>

                                <div className={styles.detailSection}>
                                    <div className={styles.detailLabel}>Khách hàng</div>
                                    <div className={styles.detailValue}>{user?.name || 'Ẩn danh'}</div>
                                </div>

                                <div className={styles.detailSection}>
                                    <div className={styles.detailLabel}>Ngày đánh giá</div>
                                    <div className={styles.detailValue}>{formatDate(selectedReview.createdAt)}</div>
                                </div>

                                <div className={styles.detailSection}>
                                    <div className={styles.detailLabel}>Trạng thái</div>
                                    <div className={styles.detailValue}>
                                        {selectedReview.isVerified ? '✓ Đã mua hàng' : '✗ Chưa xác minh'}
                                    </div>
                                </div>

                                {selectedReview.title && (
                                    <div className={styles.detailSection}>
                                        <div className={styles.detailLabel}>Tiêu đề</div>
                                        <div className={styles.detailValue}>{selectedReview.title}</div>
                                    </div>
                                )}

                                <div className={styles.detailSection}>
                                    <div className={styles.detailLabel}>Nội dung</div>
                                    <div className={styles.detailContent}>{selectedReview.content || 'Không có nội dung'}</div>
                                </div>

                                {selectedReview.pros.length > 0 && (
                                    <div className={styles.detailSection}>
                                        <div className={styles.detailLabel}>Ưu điểm</div>
                                        <ul className={styles.prosList}>
                                            {selectedReview.pros.map((p, i) => <li key={i}>+ {p}</li>)}
                                        </ul>
                                    </div>
                                )}

                                {selectedReview.cons.length > 0 && (
                                    <div className={styles.detailSection}>
                                        <div className={styles.detailLabel}>Nhược điểm</div>
                                        <ul className={styles.consList}>
                                            {selectedReview.cons.map((c, i) => <li key={i}>- {c}</li>)}
                                        </ul>
                                    </div>
                                )}

                                {selectedReview.images.length > 0 && (
                                    <div className={styles.detailSection}>
                                        <div className={styles.detailLabel}>Hình ảnh ({selectedReview.images.length})</div>
                                        <div className={styles.imageGrid}>
                                            {selectedReview.images.map((img, i) => (
                                                <img key={i} src={img} alt={`Review ${i}`} className={styles.reviewImage} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className={styles.detailActions}>
                                    {!selectedReview.isApproved ? (
                                        <button
                                            className={`${styles.actionBtn} ${styles.approveBtn}`}
                                            onClick={() => handleApprove(selectedReview._id, true)}
                                        >
                                            ✓ DUYỆT ĐÁNH GIÁ
                                        </button>
                                    ) : (
                                        <button
                                            className={`${styles.actionBtn} ${styles.rejectBtn}`}
                                            onClick={() => handleApprove(selectedReview._id, false)}
                                        >
                                            ✕ ẨN ĐÁNH GIÁ
                                        </button>
                                    )}
                                    <button
                                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                        onClick={() => handleDelete(selectedReview._id)}
                                    >
                                        🗑 XÓA
                                    </button>
                                </div>
                            </>
                        )
                    })() : (
                        <div className={styles.emptyDetail}>
                            <span className={styles.emptyIcon}>⭐</span>
                            <span className={styles.emptyText}>Chọn đánh giá để xem chi tiết</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
