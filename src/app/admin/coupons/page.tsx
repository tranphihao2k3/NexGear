// ============================================================
// NEXGEAR — Admin Coupons Page
// CRUD: list, add, edit, delete, toggle active
// ============================================================
'use client'

import { useState, useEffect } from 'react'
import styles from './page.module.scss'
import { useToast } from '@/components/ui'

interface Coupon {
    _id: string
    code: string
    type: 'percent' | 'fixed' | 'shipping'
    value: number
    minOrderValue: number
    maxDiscount: number | null
    maxUses: number
    usedCount: number
    startAt: string
    expireAt: string
    isActive: boolean
    createdAt: string
}

const TYPE_LABELS: Record<string, string> = {
    percent: 'Giảm %',
    fixed: 'Giảm tiền',
    shipping: 'Free ship',
}

function formatVND(amount: number) {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('vi-VN')
}

function toInputDate(dateStr: string) {
    if (!dateStr) return ''
    return new Date(dateStr).toISOString().split('T')[0]
}

function getCouponStatus(coupon: Coupon): { label: string; cls: string } {
    if (!coupon.isActive) return { label: 'Tắt', cls: 'inactive' }
    const now = new Date()
    if (new Date(coupon.expireAt) < now) return { label: 'Hết hạn', cls: 'expired' }
    if (new Date(coupon.startAt) > now) return { label: 'Chưa bắt đầu', cls: 'upcoming' }
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) return { label: 'Hết lượt', cls: 'exhausted' }
    return { label: 'Đang hoạt động', cls: 'active' }
}

export default function AdminCouponsPage() {
    const { success, error } = useToast()
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [loading, setLoading] = useState(true)

    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        code: '',
        type: 'percent' as 'percent' | 'fixed' | 'shipping',
        value: '',
        minOrderValue: '',
        maxDiscount: '',
        maxUses: '',
        startAt: new Date().toISOString().split('T')[0],
        expireAt: '',
    })

    const fetchCoupons = async () => {
        try {
            const res = await fetch('/api/coupons?limit=50')
            const json = await res.json()
            if (json.success) setCoupons(json.data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCoupons()
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const openAdd = () => {
        setEditingId(null)
        setFormData({
            code: '', type: 'percent', value: '', minOrderValue: '',
            maxDiscount: '', maxUses: '',
            startAt: new Date().toISOString().split('T')[0], expireAt: '',
        })
        setShowModal(true)
    }

    const openEdit = (c: Coupon) => {
        setEditingId(c._id)
        setFormData({
            code: c.code,
            type: c.type,
            value: c.value.toString(),
            minOrderValue: c.minOrderValue ? c.minOrderValue.toString() : '',
            maxDiscount: c.maxDiscount ? c.maxDiscount.toString() : '',
            maxUses: c.maxUses ? c.maxUses.toString() : '',
            startAt: toInputDate(c.startAt),
            expireAt: toInputDate(c.expireAt),
        })
        setShowModal(true)
    }

    const saveItem = async () => {
        if (!formData.code || !formData.value || !formData.startAt || !formData.expireAt) {
            return error('Vui lòng điền đủ: mã, giá trị, ngày bắt đầu và kết thúc')
        }
        setSaving(true)
        try {
            const url = editingId ? `/api/coupons/${editingId}` : '/api/coupons'
            const res = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: formData.code.toUpperCase(),
                    type: formData.type,
                    value: Number(formData.value),
                    minOrderValue: formData.minOrderValue ? Number(formData.minOrderValue) : 0,
                    maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
                    maxUses: formData.maxUses ? Number(formData.maxUses) : 0,
                    startAt: new Date(formData.startAt).toISOString(),
                    expireAt: new Date(formData.expireAt).toISOString(),
                }),
            })
            const data = await res.json()
            if (!data.success) throw new Error(data.error)
            success(editingId ? 'Đã cập nhật mã giảm giá' : 'Đã thêm mã giảm giá')
            setShowModal(false)
            fetchCoupons()
        } catch (e: any) {
            error(e.message)
        } finally {
            setSaving(false)
        }
    }

    const toggleActive = async (c: Coupon) => {
        try {
            const res = await fetch(`/api/coupons/${c._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !c.isActive }),
            })
            const data = await res.json()
            if (data.success) {
                setCoupons((prev) =>
                    prev.map((x) => (x._id === c._id ? { ...x, isActive: !x.isActive } : x))
                )
            }
        } catch {
            error('Lỗi cập nhật')
        }
    }

    const deleteItem = async (id: string) => {
        if (!confirm('Xóa mã giảm giá này?')) return
        try {
            const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' })
            const data = await res.json()
            if (data.success) {
                success('Đã xóa')
                fetchCoupons()
            } else {
                error(data.error)
            }
        } catch {
            error('Lỗi xóa')
        }
    }

    return (
        <div>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Mã giảm giá</h1>
                    <div className={styles.subtitle}>{coupons.length} coupon</div>
                </div>
                <button className={styles.addBtn} onClick={openAdd}>
                    + THÊM MÃ GIẢM GIÁ
                </button>
            </div>

            {/* Stats row */}
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{coupons.filter((c) => getCouponStatus(c).cls === 'active').length}</div>
                    <div className={styles.statLabel}>Đang hoạt động</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{coupons.reduce((s, c) => s + c.usedCount, 0)}</div>
                    <div className={styles.statLabel}>Lượt sử dụng</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{coupons.filter((c) => getCouponStatus(c).cls === 'expired').length}</div>
                    <div className={styles.statLabel}>Đã hết hạn</div>
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Mã</th>
                            <th>Loại</th>
                            <th>Giá trị</th>
                            <th>Đơn tối thiểu</th>
                            <th>Sử dụng</th>
                            <th>Thời hạn</th>
                            <th>Trạng thái</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8}>Đang tải...</td></tr>
                        ) : coupons.length === 0 ? (
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.4)' }}>Chưa có mã giảm giá nào</td></tr>
                        ) : (
                            coupons.map((c) => {
                                const status = getCouponStatus(c)
                                return (
                                    <tr key={c._id}>
                                        <td>
                                            <span className={styles.couponCode}>{c.code}</span>
                                        </td>
                                        <td>
                                            <span className={`${styles.typeBadge} ${styles[c.type]}`}>
                                                {TYPE_LABELS[c.type]}
                                            </span>
                                        </td>
                                        <td style={{ color: '#fff', fontWeight: 500 }}>
                                            {c.type === 'percent' ? `${c.value}%` : c.type === 'shipping' ? 'Free' : formatVND(c.value)}
                                            {c.maxDiscount ? ` (max ${formatVND(c.maxDiscount)})` : ''}
                                        </td>
                                        <td>{c.minOrderValue ? formatVND(c.minOrderValue) : '---'}</td>
                                        <td>
                                            <span className={styles.usageCount}>
                                                {c.usedCount}{c.maxUses > 0 ? ` / ${c.maxUses}` : ' / ∞'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={styles.dateRange}>
                                                {formatDate(c.startAt)} — {formatDate(c.expireAt)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[status.cls]}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.rowActions}>
                                                <button
                                                    className={styles.rowActionBtn}
                                                    onClick={() => toggleActive(c)}
                                                    title={c.isActive ? 'Tắt' : 'Bật'}
                                                >
                                                    {c.isActive ? '⏸' : '▶'}
                                                </button>
                                                <button className={styles.rowActionBtn} onClick={() => openEdit(c)}>✏️</button>
                                                <button className={`${styles.rowActionBtn} ${styles.danger}`} onClick={() => deleteItem(c._id)}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <span className={styles.modalTitle}>{editingId ? 'Sửa mã giảm giá' : 'Thêm mã giảm giá mới'}</span>
                            <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Mã coupon *</label>
                                    <input
                                        type="text" name="code" className={styles.formInput}
                                        value={formData.code} onChange={handleInputChange}
                                        placeholder="VD: SALE50" style={{ textTransform: 'uppercase' }}
                                        disabled={!!editingId}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Loại giảm giá *</label>
                                    <select name="type" className={styles.formInput} value={formData.type} onChange={handleInputChange}>
                                        <option value="percent">Giảm %</option>
                                        <option value="fixed">Giảm tiền cố định</option>
                                        <option value="shipping">Miễn phí ship</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>
                                        Giá trị * {formData.type === 'percent' ? '(%)' : formData.type === 'fixed' ? '(VNĐ)' : ''}
                                    </label>
                                    <input type="number" name="value" className={styles.formInput} value={formData.value} onChange={handleInputChange} placeholder={formData.type === 'percent' ? '10' : '50000'} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Giảm tối đa (VNĐ)</label>
                                    <input type="number" name="maxDiscount" className={styles.formInput} value={formData.maxDiscount} onChange={handleInputChange} placeholder="Trống = không giới hạn" />
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Đơn tối thiểu (VNĐ)</label>
                                    <input type="number" name="minOrderValue" className={styles.formInput} value={formData.minOrderValue} onChange={handleInputChange} placeholder="0 = không yêu cầu" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Số lượt dùng tối đa</label>
                                    <input type="number" name="maxUses" className={styles.formInput} value={formData.maxUses} onChange={handleInputChange} placeholder="0 = không giới hạn" />
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Ngày bắt đầu *</label>
                                    <input type="date" name="startAt" className={styles.formInput} value={formData.startAt} onChange={handleInputChange} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Ngày kết thúc *</label>
                                    <input type="date" name="expireAt" className={styles.formInput} value={formData.expireAt} onChange={handleInputChange} />
                                </div>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setShowModal(false)} disabled={saving}>HỦY</button>
                            <button className={styles.saveBtn} onClick={saveItem} disabled={saving}>
                                {saving ? 'Đang lưu...' : 'LƯU'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
