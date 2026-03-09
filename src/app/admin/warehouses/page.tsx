// ============================================================
// NEXGEAR — Admin Warehouses Page
// ============================================================
'use client'

import { useState, useEffect, useCallback } from 'react'
import styles from './page.module.scss'
import { CyberpunkLoader, useToast } from '@/components/ui'

interface Warehouse {
    _id: string
    warehouseCode: string
    name: string
    address: string
    managerId: any
    capacity: number
    currentStock: number
    isDefault: boolean
    status: 'active' | 'inactive'
    notes: string
}

export default function AdminWarehousesPage() {
    const { success, error } = useToast()
    const [warehouses, setWarehouses] = useState<Warehouse[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    const [filterStatus, setFilterStatus] = useState('')

    const [formCode, setFormCode] = useState('')
    const [formName, setFormName] = useState('')
    const [formAddress, setFormAddress] = useState('')
    const [formCapacity, setFormCapacity] = useState('0')
    const [formIsDefault, setFormIsDefault] = useState(false)
    const [formStatus, setFormStatus] = useState('active')
    const [formNotes, setFormNotes] = useState('')

    const fetchWarehouses = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (filterStatus) params.set('status', filterStatus)
            params.set('limit', '100')

            const res = await fetch(`/api/warehouses?${params}`)
            const json = await res.json()
            if (json.success) {
                setWarehouses(json.data)
            }
        } catch (err) {
            console.error('Failed to fetch warehouses:', err)
        } finally {
            setLoading(false)
        }
    }, [filterStatus])

    useEffect(() => { fetchWarehouses() }, [fetchWarehouses])

    const resetForm = () => {
        setEditingId(null)
        setFormCode('')
        setFormName('')
        setFormAddress('')
        setFormCapacity('0')
        setFormIsDefault(false)
        setFormStatus('active')
        setFormNotes('')
    }

    const openAddModal = () => {
        resetForm()
        setShowModal(true)
    }

    const openEditModal = (wh: Warehouse) => {
        setEditingId(wh._id)
        setFormCode(wh.warehouseCode)
        setFormName(wh.name)
        setFormAddress(wh.address || '')
        setFormCapacity(wh.capacity?.toString() || '0')
        setFormIsDefault(wh.isDefault || false)
        setFormStatus(wh.status)
        setFormNotes(wh.notes || '')
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!formCode || !formName) {
            return error('Vui lòng nhập mã kho và tên kho')
        }
        setSaving(true)
        try {
            const payload = {
                warehouseCode: formCode,
                name: formName,
                address: formAddress,
                capacity: parseInt(formCapacity) || 0,
                isDefault: formIsDefault,
                status: formStatus,
                notes: formNotes,
            }

            let res
            if (editingId) {
                res = await fetch(`/api/warehouses/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
            } else {
                res = await fetch('/api/warehouses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
            }

            const json = await res.json()
            if (!json.success) throw new Error(json.error || 'Lưu thất bại')
            success(editingId ? 'Đã cập nhật' : 'Đã thêm kho')
            setShowModal(false)
            resetForm()
            fetchWarehouses()
        } catch (e: any) {
            error(e.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (wh: Warehouse) => {
        if (!confirm(`Xóa kho ${wh.name}?`)) return
        try {
            const res = await fetch(`/api/warehouses/${wh._id}`, { method: 'DELETE' })
            const json = await res.json()
            if (json.success) {
                success('Đã xóa kho')
                fetchWarehouses()
            } else {
                error(json.error || 'Xóa thất bại')
            }
        } catch {
            error('Lỗi kết nối')
        }
    }

    const activeCount = warehouses.filter(w => w.status === 'active').length

    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Quản lý kho bãi</h1>
                    <select
                        className={styles.filterSelect}
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="active">Hoạt động</option>
                        <option value="inactive">Không hoạt động</option>
                    </select>
                </div>
                <button className={styles.addBtn} onClick={openAddModal}>
                    + THÊM KHO
                </button>
            </div>

            <div className={styles.summary}>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Tổng kho</span>
                    <span className={styles.summaryValue}>{warehouses.length}</span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Hoạt động</span>
                    <span className={`${styles.summaryValue} ${styles.green}`}>{activeCount}</span>
                </div>
            </div>

            {loading ? (
                <CyberpunkLoader message="Đang tải..." compact />
            ) : warehouses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>
                    Chưa có kho nào
                </div>
            ) : (
                <div className={styles.grid}>
                    {warehouses.map((wh) => (
                        <div key={wh._id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div className={styles.cardTitle}>
                                    <span className={styles.warehouseCode}>{wh.warehouseCode}</span>
                                    {wh.isDefault && <span className={styles.defaultBadge}>Mặc định</span>}
                                </div>
                                <span className={`${styles.statusBadge} ${wh.status === 'active' ? styles.active : ''}`}>
                                    {wh.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                                </span>
                            </div>
                            <div className={styles.cardBody}>
                                <h3 className={styles.warehouseName}>{wh.name}</h3>
                                {wh.address && <p className={styles.address}>{wh.address}</p>}
                                <div className={styles.stats}>
                                    <div className={styles.stat}>
                                        <span className={styles.statLabel}>Dung lượng</span>
                                        <span className={styles.statValue}>{wh.capacity || 0}</span>
                                    </div>
                                    <div className={styles.stat}>
                                        <span className={styles.statLabel}>Tồn kho</span>
                                        <span className={styles.statValue}>{wh.currentStock || 0}</span>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.cardFooter}>
                                <button className={styles.editBtn} onClick={() => openEditModal(wh)}>
                                    ✏️ Sửa
                                </button>
                                <button className={styles.deleteBtn} onClick={() => handleDelete(wh)}>
                                    🗑️ Xóa
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <span className={styles.modalTitle}>
                                {editingId ? 'Chỉnh sửa kho' : 'Thêm kho mới'}
                            </span>
                            <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Mã kho</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={formCode}
                                        onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                                        placeholder="WH001"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Tên kho</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        placeholder="Kho chính"
                                    />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Địa chỉ</label>
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    value={formAddress}
                                    onChange={(e) => setFormAddress(e.target.value)}
                                    placeholder="Địa chỉ kho..."
                                />
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Dung lượng</label>
                                    <input
                                        type="number"
                                        className={styles.formInput}
                                        value={formCapacity}
                                        onChange={(e) => setFormCapacity(e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Trạng thái</label>
                                    <select
                                        className={styles.formInput}
                                        value={formStatus}
                                        onChange={(e) => setFormStatus(e.target.value)}
                                    >
                                        <option value="active">Hoạt động</option>
                                        <option value="inactive">Không hoạt động</option>
                                    </select>
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={formIsDefault}
                                        onChange={(e) => setFormIsDefault(e.target.checked)}
                                    />
                                    Đặt làm kho mặc định
                                </label>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Ghi chú</label>
                                <textarea
                                    className={styles.formTextarea}
                                    value={formNotes}
                                    onChange={(e) => setFormNotes(e.target.value)}
                                    rows={2}
                                />
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
        </>
    )
}
