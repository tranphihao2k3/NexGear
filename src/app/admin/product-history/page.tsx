// ============================================================
// LTV — Admin Product History Page
// ============================================================
'use client'

import { useState, useEffect, useCallback } from 'react'
import styles from './page.module.scss'
import { CyberpunkLoader, useToast } from '@/components/ui'

interface ProductUnit {
    _id: string
    sku: string
    serialNumber: string
    condition: string
    batteryCycle?: number
    product?: {
        name: string
        sku: string
        model?: string
    }
}

interface User {
    _id: string
    name: string
    email: string
}

interface ProductHistoryRecord {
    _id: string
    productUnit: ProductUnit
    eventType: string
    eventDate: string
    description: string
    relatedType?: string
    relatedId?: string
    performedBy?: User
    metadata: Record<string, unknown>
    createdAt: string
}

const EVENT_TYPES = [
    { value: 'purchased', label: 'Mua vào', color: 'blue' },
    { value: 'sold', label: 'Bán ra', color: 'green' },
    { value: 'transferred', label: 'Chuyển giao', color: 'purple' },
    { value: 'repaired', label: 'Sửa chữa', color: 'orange' },
    { value: 'warranty_claimed', label: 'Bảo hành', color: 'cyan' },
    { value: 'returned', label: 'Trả lại', color: 'red' },
    { value: 'scrapped', label: 'Thanh lý', color: 'gray' },
    { value: 'condition_changed', label: 'Đổi tình trạng', color: 'yellow' },
]

const EVENT_TYPE_MAP: Record<string, { label: string; color: string }> = EVENT_TYPES.reduce((acc, e) => {
    acc[e.value] = { label: e.label, color: e.color }
    return acc
}, {} as Record<string, { label: string; color: string }>)

const CONDITIONS = [
    { value: 'new', label: 'Mới' },
    { value: 'like_new', label: 'Như mới' },
    { value: 'customer_new', label: 'Khách để lại' },
    { value: 'good', label: 'Tốt' },
    { value: 'fair', label: 'Trung bình' },
    { value: 'poor', label: 'Kém' },
]

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export default function AdminProductHistoryPage() {
    const { success, error } = useToast()
    const [history, setHistory] = useState<ProductHistoryRecord[]>([])
    const [productUnits, setProductUnits] = useState<ProductUnit[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [viewingRecord, setViewingRecord] = useState<ProductHistoryRecord | null>(null)

    const [filterProductUnit, setFilterProductUnit] = useState('')
    const [filterEventType, setFilterEventType] = useState('')

    const [formProductUnit, setFormProductUnit] = useState('')
    const [formEventType, setFormEventType] = useState('purchased')
    const [formEventDate, setFormEventDate] = useState(new Date().toISOString().slice(0, 16))
    const [formDescription, setFormDescription] = useState('')
    const [formRelatedType, setFormRelatedType] = useState('')
    const [formRelatedId, setFormRelatedId] = useState('')

    const fetchProductUnits = useCallback(async () => {
        try {
            const res = await fetch('/api/product-units?limit=200')
            const json = await res.json()
            if (json.success) {
                setProductUnits(json.data)
            }
        } catch (err) {
            console.error('Failed to fetch product units:', err)
        }
    }, [])

    const fetchHistory = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (filterProductUnit) params.set('productUnit', filterProductUnit)
            if (filterEventType) params.set('eventType', filterEventType)
            params.set('limit', '100')

            const res = await fetch(`/api/product-history?${params}`)
            const json = await res.json()
            if (json.success) {
                setHistory(json.data)
            }
        } catch (err) {
            console.error('Failed to fetch history:', err)
        } finally {
            setLoading(false)
        }
    }, [filterProductUnit, filterEventType])

    useEffect(() => { fetchProductUnits() }, [fetchProductUnits])
    useEffect(() => { fetchHistory() }, [fetchHistory])

    const resetForm = () => {
        setEditingId(null)
        setFormProductUnit('')
        setFormEventType('purchased')
        setFormEventDate(new Date().toISOString().slice(0, 16))
        setFormDescription('')
        setFormRelatedType('')
        setFormRelatedId('')
    }

    const openAddModal = () => {
        resetForm()
        setShowModal(true)
    }

    const openEditModal = (record: ProductHistoryRecord) => {
        setEditingId(record._id)
        setFormProductUnit(record.productUnit._id)
        setFormEventType(record.eventType)
        setFormEventDate(new Date(record.eventDate).toISOString().slice(0, 16))
        setFormDescription(record.description)
        setFormRelatedType(record.relatedType || '')
        setFormRelatedId(record.relatedId || '')
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!formProductUnit || !formEventType || !formDescription) {
            return error('Vui lòng nhập đầy đủ thông tin')
        }
        setSaving(true)
        try {
            const payload = {
                productUnit: formProductUnit,
                eventType: formEventType,
                eventDate: new Date(formEventDate).toISOString(),
                description: formDescription,
                relatedType: formRelatedType || null,
                relatedId: formRelatedId || null,
            }

            let res
            if (editingId) {
                res = await fetch(`/api/product-history/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
            } else {
                res = await fetch('/api/product-history', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
            }

            const json = await res.json()
            if (!json.success) throw new Error(json.error || 'Lưu thất bại')
            success(editingId ? 'Đã cập nhật' : 'Đã thêm lịch sử')
            setShowModal(false)
            resetForm()
            fetchHistory()
        } catch (e: any) {
            error(e.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (record: ProductHistoryRecord) => {
        if (!confirm('Xóa bản ghi lịch sử này?')) return
        try {
            const res = await fetch(`/api/product-history/${record._id}`, { method: 'DELETE' })
            const json = await res.json()
            if (json.success) {
                success('Đã xóa bản ghi')
                fetchHistory()
            } else {
                error(json.error || 'Xóa thất bại')
            }
        } catch {
            error('Lỗi kết nối')
        }
    }

    const getProductName = (unit: ProductUnit) => {
        return unit.product?.name || unit.serialNumber || unit.sku || '-'
    }

    const getConditionLabel = (condition: string) => {
        return CONDITIONS.find(c => c.value === condition)?.label || condition
    }

    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Lịch sử sản phẩm</h1>
                    <div className={styles.filterGroup}>
                        <select
                            className={styles.filterSelect}
                            value={filterProductUnit}
                            onChange={(e) => setFilterProductUnit(e.target.value)}
                        >
                            <option value="">Tất cả sản phẩm</option>
                            {productUnits.map(unit => (
                                <option key={unit._id} value={unit._id}>
                                    {getProductName(unit)} - {unit.serialNumber}
                                </option>
                            ))}
                        </select>
                        <select
                            className={styles.filterSelect}
                            value={filterEventType}
                            onChange={(e) => setFilterEventType(e.target.value)}
                        >
                            <option value="">Tất cả sự kiện</option>
                            {EVENT_TYPES.map(e => (
                                <option key={e.value} value={e.value}>{e.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <button className={styles.addBtn} onClick={openAddModal}>
                    + THÊM SỰ KIỆN
                </button>
            </div>

            <div className={styles.summary}>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Tổng bản ghi</span>
                    <span className={styles.summaryValue}>{history.length}</span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Đã bán</span>
                    <span className={styles.summaryValue}>
                        {history.filter(h => h.eventType === 'sold').length}
                    </span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Đã mua</span>
                    <span className={styles.summaryValue}>
                        {history.filter(h => h.eventType === 'purchased').length}
                    </span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Bảo hành</span>
                    <span className={styles.summaryValue}>
                        {history.filter(h => h.eventType === 'warranty_claimed').length}
                    </span>
                </div>
            </div>

            {loading ? (
                <CyberpunkLoader message="Đang tải lịch sử..." compact />
            ) : history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>
                    Chưa có lịch sử sản phẩm
                </div>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Serial</th>
                                <th>Loại sự kiện</th>
                                <th>Mô tả</th>
                                <th>Ngày</th>
                                <th>Người thực hiện</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((record) => {
                                const unit = record.productUnit as any
                                const user = record.performedBy as any
                                const eventInfo = EVENT_TYPE_MAP[record.eventType] || { label: record.eventType, color: 'gray' }
                                return (
                                <tr key={record._id}>
                                    <td>
                                        <div className={styles.productName}>
                                            {getProductName(unit)}
                                        </div>
                                    </td>
                                    <td className={styles.mono}>{unit?.serialNumber || unit?.sku || '-'}</td>
                                    <td>
                                        <span className={`${styles.eventType} ${styles[eventInfo.color]}`}>
                                            {eventInfo.label}
                                        </span>
                                    </td>
                                    <td className={styles.description}>
                                        {record.description.length > 50 
                                            ? record.description.slice(0, 50) + '...'
                                            : record.description}
                                    </td>
                                    <td className={styles.date}>{formatDate(record.eventDate)}</td>
                                    <td>{user?.name || user?.email || '-'}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button 
                                                className={styles.actionBtn} 
                                                onClick={() => setViewingRecord(record)}
                                                title="Xem chi tiết"
                                            >
                                                👁️
                                            </button>
                                            <button className={styles.actionBtn} onClick={() => openEditModal(record)}>
                                                ✏️
                                            </button>
                                            <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDelete(record)}>
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <span className={styles.modalTitle}>
                                {editingId ? 'Chỉnh sửa lịch sử' : 'Thêm sự kiện'}
                            </span>
                            <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Sản phẩm</label>
                                <select
                                    className={styles.formInput}
                                    value={formProductUnit}
                                    onChange={(e) => setFormProductUnit(e.target.value)}
                                    disabled={!!editingId}
                                >
                                    <option value="">-- Chọn sản phẩm --</option>
                                    {productUnits.map(unit => (
                                        <option key={unit._id} value={unit._id}>
                                            {getProductName(unit)} - {unit.serialNumber}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Loại sự kiện</label>
                                    <select
                                        className={styles.formInput}
                                        value={formEventType}
                                        onChange={(e) => setFormEventType(e.target.value)}
                                    >
                                        {EVENT_TYPES.map(e => (
                                            <option key={e.value} value={e.value}>{e.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Ngày sự kiện</label>
                                    <input
                                        type="datetime-local"
                                        className={styles.formInput}
                                        value={formEventDate}
                                        onChange={(e) => setFormEventDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Mô tả</label>
                                <textarea
                                    className={styles.formTextarea}
                                    placeholder="Mô tả chi tiết sự kiện..."
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Loại liên quan (tùy chọn)</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        placeholder="Ví dụ: Order, Customer"
                                        value={formRelatedType}
                                        onChange={(e) => setFormRelatedType(e.target.value)}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>ID liên quan (tùy chọn)</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        placeholder="ID của đối tượng liên quan"
                                        value={formRelatedId}
                                        onChange={(e) => setFormRelatedId(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setShowModal(false)} disabled={saving}>HỦY</button>
                            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                                {saving ? 'Đang lưu...' : editingId ? '✓ CẬP NHẬT' : '✓ LƯU'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Detail Modal */}
            {viewingRecord && (
                <div className={styles.modalOverlay} onClick={() => setViewingRecord(null)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <span className={styles.modalTitle}>Chi tiết lịch sử</span>
                            <button className={styles.modalClose} onClick={() => setViewingRecord(null)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Sản phẩm</span>
                                <span className={styles.detailValue}>
                                    {getProductName(viewingRecord.productUnit as any)}
                                </span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Serial</span>
                                <span className={styles.detailValue}>
                                    {(viewingRecord.productUnit as any)?.serialNumber || '-'}
                                </span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Tình trạng</span>
                                <span className={styles.detailValue}>
                                    {getConditionLabel((viewingRecord.productUnit as any)?.condition)}
                                </span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Loại sự kiện</span>
                                <span className={`${styles.eventType} ${styles[EVENT_TYPE_MAP[viewingRecord.eventType]?.color || 'gray']}`}>
                                    {EVENT_TYPE_MAP[viewingRecord.eventType]?.label || viewingRecord.eventType}
                                </span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Ngày sự kiện</span>
                                <span className={styles.detailValue}>
                                    {formatDate(viewingRecord.eventDate)}
                                </span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Mô tả</span>
                                <span className={styles.detailValue}>
                                    {viewingRecord.description}
                                </span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Người thực hiện</span>
                                <span className={styles.detailValue}>
                                    {(viewingRecord.performedBy as any)?.name || (viewingRecord.performedBy as any)?.email || '-'}
                                </span>
                            </div>
                            {viewingRecord.relatedType && (
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Liên quan đến</span>
                                    <span className={styles.detailValue}>
                                        {viewingRecord.relatedType}: {viewingRecord.relatedId}
                                    </span>
                                </div>
                            )}
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Tạo lúc</span>
                                <span className={styles.detailValue}>
                                    {formatDate(viewingRecord.createdAt)}
                                </span>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setViewingRecord(null)}>ĐÓNG</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
