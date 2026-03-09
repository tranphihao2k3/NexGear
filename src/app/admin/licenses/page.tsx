// ============================================================
// NEXGEAR — Admin Licenses Page
// ============================================================
'use client'

import { useState, useEffect, useCallback } from 'react'
import styles from './page.module.scss'
import { CyberpunkLoader, useToast } from '@/components/ui'

interface Software {
    _id: string
    title: string
    version: string
    type: string
}

interface License {
    _id: string
    key: string
    hwid: string
    software: Software
    expiryDate: string
    customerName: string
    customerPhone: string
    status: 'active' | 'blocked' | 'expired'
    note: string
    lastUsed: string
}

const STATUS_LABELS: Record<string, string> = {
    active: 'Hoạt động',
    blocked: 'Bị khóa',
    expired: 'Hết hạn',
}

const STATUS_COLORS: Record<string, string> = {
    active: 'green',
    blocked: 'red',
    expired: 'orange',
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

function generateLicenseKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const segments = 4
    const segmentLength = 5
    const key = []
    for (let s = 0; s < segments; s++) {
        let segment = ''
        for (let i = 0; i < segmentLength; i++) {
            segment += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        key.push(segment)
    }
    return key.join('-')
}

export default function AdminLicensesPage() {
    const { success, error } = useToast()
    const [licenses, setLicenses] = useState<License[]>([])
    const [softwareList, setSoftwareList] = useState<Software[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    const [filterStatus, setFilterStatus] = useState('')
    const [filterSoftware, setFilterSoftware] = useState('')
    const [search, setSearch] = useState('')

    const [formKey, setFormKey] = useState('')
    const [formSoftware, setFormSoftware] = useState('')
    const [formExpiryDate, setFormExpiryDate] = useState('')
    const [formCustomerName, setFormCustomerName] = useState('')
    const [formCustomerPhone, setFormCustomerPhone] = useState('')
    const [formStatus, setFormStatus] = useState('active')
    const [formNote, setFormNote] = useState('')

    const fetchSoftware = useCallback(async () => {
        try {
            const res = await fetch('/api/software?limit=100')
            const json = await res.json()
            if (json.success) {
                setSoftwareList(json.data)
            }
        } catch (err) {
            console.error('Failed to fetch software:', err)
        }
    }, [])

    const fetchLicenses = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (filterStatus) params.set('status', filterStatus)
            if (filterSoftware) params.set('software', filterSoftware)
            if (search) params.set('search', search)
            params.set('limit', '100')

            const res = await fetch(`/api/licenses?${params}`)
            const json = await res.json()
            if (json.success) {
                setLicenses(json.data)
            }
        } catch (err) {
            console.error('Failed to fetch licenses:', err)
        } finally {
            setLoading(false)
        }
    }, [filterStatus, filterSoftware, search])

    useEffect(() => { fetchSoftware() }, [fetchSoftware])
    useEffect(() => { fetchLicenses() }, [fetchLicenses])

    const resetForm = () => {
        setEditingId(null)
        setFormKey('')
        setFormSoftware('')
        setFormExpiryDate('')
        setFormCustomerName('')
        setFormCustomerPhone('')
        setFormStatus('active')
        setFormNote('')
    }

    const openAddModal = () => {
        resetForm()
        setFormKey(generateLicenseKey())
        const nextMonth = new Date()
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        setFormExpiryDate(nextMonth.toISOString().slice(0, 10))
        setShowModal(true)
    }

    const openEditModal = (license: License) => {
        setEditingId(license._id)
        setFormKey(license.key)
        setFormSoftware(typeof license.software === 'object' ? license.software._id : '')
        setFormExpiryDate(new Date(license.expiryDate).toISOString().slice(0, 10))
        setFormCustomerName(license.customerName)
        setFormCustomerPhone(license.customerPhone)
        setFormStatus(license.status)
        setFormNote(license.note)
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!formKey || !formSoftware || !formExpiryDate) {
            return error('Vui lòng nhập đầy đủ thông tin')
        }
        setSaving(true)
        try {
            const payload = {
                key: formKey,
                software: formSoftware,
                expiryDate: new Date(formExpiryDate).toISOString(),
                customerName: formCustomerName,
                customerPhone: formCustomerPhone,
                status: formStatus,
                note: formNote,
            }

            let res
            if (editingId) {
                res = await fetch(`/api/licenses/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
            } else {
                res = await fetch('/api/licenses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
            }

            const json = await res.json()
            if (!json.success) throw new Error(json.error || 'Lưu thất bại')
            success(editingId ? 'Đã cập nhật' : 'Đã thêm bản quyền')
            setShowModal(false)
            resetForm()
            fetchLicenses()
        } catch (e: any) {
            error(e.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (license: License) => {
        if (!confirm(`Xóa bản quyền ${license.key}?`)) return
        try {
            const res = await fetch(`/api/licenses/${license._id}`, { method: 'DELETE' })
            const json = await res.json()
            if (json.success) {
                success('Đã xóa bản quyền')
                fetchLicenses()
            } else {
                error(json.error || 'Xóa thất bại')
            }
        } catch {
            error('Lỗi kết nối')
        }
    }

    const handleGenerateKey = () => {
        setFormKey(generateLicenseKey())
    }

    const getSoftwareName = (sw: any) => {
        return sw?.title || '-'
    }

    const isExpired = (dateStr: string) => {
        return new Date(dateStr) < new Date()
    }

    const activeCount = licenses.filter(l => l.status === 'active' && !isExpired(l.expiryDate)).length
    const expiredCount = licenses.filter(l => l.status === 'expired' || isExpired(l.expiryDate)).length
    const blockedCount = licenses.filter(l => l.status === 'blocked').length

    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Bản quyền phần mềm</h1>
                    <div className={styles.filterGroup}>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Tìm kiếm..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <select
                            className={styles.filterSelect}
                            value={filterSoftware}
                            onChange={(e) => setFilterSoftware(e.target.value)}
                        >
                            <option value="">Tất cả phần mềm</option>
                            {softwareList.map(sw => (
                                <option key={sw._id} value={sw._id}>{sw.title}</option>
                            ))}
                        </select>
                        <select
                            className={styles.filterSelect}
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="active">Hoạt động</option>
                            <option value="blocked">Bị khóa</option>
                            <option value="expired">Hết hạn</option>
                        </select>
                    </div>
                </div>
                <button className={styles.addBtn} onClick={openAddModal}>
                    + THÊM BẢN QUYỀN
                </button>
            </div>

            <div className={styles.summary}>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Tổng bản quyền</span>
                    <span className={styles.summaryValue}>{licenses.length}</span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Hoạt động</span>
                    <span className={`${styles.summaryValue} ${styles.green}`}>{activeCount}</span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Hết hạn</span>
                    <span className={`${styles.summaryValue} ${styles.orange}`}>{expiredCount}</span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Bị khóa</span>
                    <span className={`${styles.summaryValue} ${styles.red}`}>{blockedCount}</span>
                </div>
            </div>

            {loading ? (
                <CyberpunkLoader message="Đang tải..." compact />
            ) : licenses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>
                    Chưa có bản quyền nào
                </div>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Mã bản quyền</th>
                                <th>Phần mềm</th>
                                <th>Khách hàng</th>
                                <th>Điện thoại</th>
                                <th>Hết hạn</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {licenses.map((license) => {
                                const sw = license.software as any
                                const expired = isExpired(license.expiryDate)
                                return (
                                <tr key={license._id}>
                                    <td className={styles.mono}>{license.key}</td>
                                    <td>{getSoftwareName(sw)}</td>
                                    <td>{license.customerName || '-'}</td>
                                    <td>{license.customerPhone || '-'}</td>
                                    <td className={expired ? styles.expired : ''}>
                                        {formatDate(license.expiryDate)}
                                    </td>
                                    <td>
                                        <span className={`${styles.status} ${styles[STATUS_COLORS[license.status]]}`}>
                                            {STATUS_LABELS[license.status]}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button className={styles.actionBtn} onClick={() => openEditModal(license)}>
                                                ✏️
                                            </button>
                                            <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDelete(license)}>
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

            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <span className={styles.modalTitle}>
                                {editingId ? 'Chỉnh sửa bản quyền' : 'Thêm bản quyền'}
                            </span>
                            <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Mã bản quyền</label>
                                <div className={styles.inputWithButton}>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={formKey}
                                        onChange={(e) => setFormKey(e.target.value.toUpperCase())}
                                        placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                                    />
                                    <button type="button" className={styles.generateBtn} onClick={handleGenerateKey}>
                                        Tạo mới
                                    </button>
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Phần mềm</label>
                                    <select
                                        className={styles.formInput}
                                        value={formSoftware}
                                        onChange={(e) => setFormSoftware(e.target.value)}
                                    >
                                        <option value="">-- Chọn phần mềm --</option>
                                        {softwareList.map(sw => (
                                            <option key={sw._id} value={sw._id}>
                                                {sw.title} v{sw.version}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Ngày hết hạn</label>
                                    <input
                                        type="date"
                                        className={styles.formInput}
                                        value={formExpiryDate}
                                        onChange={(e) => setFormExpiryDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Tên khách hàng</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        placeholder="Tên khách hàng..."
                                        value={formCustomerName}
                                        onChange={(e) => setFormCustomerName(e.target.value)}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Điện thoại</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        placeholder="Số điện thoại..."
                                        value={formCustomerPhone}
                                        onChange={(e) => setFormCustomerPhone(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Trạng thái</label>
                                <select
                                    className={styles.formInput}
                                    value={formStatus}
                                    onChange={(e) => setFormStatus(e.target.value)}
                                >
                                    <option value="active">Hoạt động</option>
                                    <option value="blocked">Bị khóa</option>
                                    <option value="expired">Hết hạn</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Ghi chú</label>
                                <textarea
                                    className={styles.formTextarea}
                                    placeholder="Ghi chú..."
                                    value={formNote}
                                    onChange={(e) => setFormNote(e.target.value)}
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
