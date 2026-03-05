// ============================================================
// NEXGEAR — Admin Suppliers Page
// CRUD: list, add, edit, delete, toggle active
// ============================================================
'use client'

import { useState, useEffect } from 'react'
import styles from '../categories/page.module.scss'
import { useToast } from '@/components/ui'

interface BankInfo {
    bankName: string
    accountNumber: string
    accountHolder: string
}

interface Supplier {
    _id: string
    name: string
    contact: string
    phone: string
    email: string
    address: string
    paymentTerms: string
    bankInfo: BankInfo
    notes: string
    isActive: boolean
    createdAt: string
}

export default function AdminSuppliersPage() {
    const { success, error } = useToast()
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [loading, setLoading] = useState(true)

    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        phone: '',
        email: '',
        address: '',
        paymentTerms: '',
        bankName: '',
        accountNumber: '',
        accountHolder: '',
        notes: '',
    })

    const fetchSuppliers = async () => {
        try {
            const res = await fetch('/api/suppliers?limit=50')
            const json = await res.json()
            if (json.success) setSuppliers(json.data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSuppliers()
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const openAdd = () => {
        setEditingId(null)
        setFormData({
            name: '', contact: '', phone: '', email: '',
            address: '', paymentTerms: '', bankName: '',
            accountNumber: '', accountHolder: '', notes: '',
        })
        setShowModal(true)
    }

    const openEdit = (s: Supplier) => {
        setEditingId(s._id)
        setFormData({
            name: s.name,
            contact: s.contact || '',
            phone: s.phone || '',
            email: s.email || '',
            address: s.address || '',
            paymentTerms: s.paymentTerms || '',
            bankName: s.bankInfo?.bankName || '',
            accountNumber: s.bankInfo?.accountNumber || '',
            accountHolder: s.bankInfo?.accountHolder || '',
            notes: s.notes || '',
        })
        setShowModal(true)
    }

    const saveItem = async () => {
        if (!formData.name) return error('Tên nhà cung cấp là bắt buộc!')
        try {
            const url = editingId ? `/api/suppliers/${editingId}` : '/api/suppliers'
            const res = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    contact: formData.contact,
                    phone: formData.phone,
                    email: formData.email,
                    address: formData.address,
                    paymentTerms: formData.paymentTerms,
                    bankInfo: {
                        bankName: formData.bankName,
                        accountNumber: formData.accountNumber,
                        accountHolder: formData.accountHolder,
                    },
                    notes: formData.notes,
                }),
            })
            const data = await res.json()
            if (!data.success) throw new Error(data.error)
            success(editingId ? 'Cập nhật NCC thành công' : 'Thêm NCC thành công')
            setShowModal(false)
            fetchSuppliers()
        } catch (e: any) {
            error(e.message)
        }
    }

    const toggleActive = async (s: Supplier) => {
        try {
            const res = await fetch(`/api/suppliers/${s._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !s.isActive }),
            })
            const data = await res.json()
            if (data.success) {
                setSuppliers((prev) =>
                    prev.map((x) => (x._id === s._id ? { ...x, isActive: !x.isActive } : x))
                )
            }
        } catch {
            error('Lỗi cập nhật')
        }
    }

    const deleteItem = async (id: string) => {
        if (!confirm('Xóa nhà cung cấp này?')) return
        try {
            const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' })
            const data = await res.json()
            if (data.success) {
                success('Đã xóa')
                fetchSuppliers()
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
                    <h1>Nhà cung cấp</h1>
                </div>
                <button className={styles.addBtn} onClick={openAdd}>
                    + THÊM NHÀ CUNG CẤP
                </button>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Tên NCC</th>
                            <th>Liên hệ</th>
                            <th>SĐT</th>
                            <th>Email</th>
                            <th>Trạng thái</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6}>Đang tải...</td></tr>
                        ) : suppliers.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.4)' }}>Chưa có nhà cung cấp nào</td></tr>
                        ) : (
                            suppliers.map((s) => (
                                <tr key={s._id}>
                                    <td style={{ color: '#fff', fontWeight: 500 }}>{s.name}</td>
                                    <td>{s.contact || '---'}</td>
                                    <td>{s.phone || '---'}</td>
                                    <td>{s.email || '---'}</td>
                                    <td>
                                        <div className={styles.statusToggle}>
                                            <div
                                                className={`${styles.toggleSwitch} ${s.isActive ? styles.on : ''}`}
                                                onClick={() => toggleActive(s)}
                                            >
                                                <div className={styles.toggleKnob} />
                                            </div>
                                            <span className={`${styles.statusText} ${s.isActive ? styles.active : ''}`}>
                                                {s.isActive ? 'Active' : 'Off'}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.rowActions}>
                                            <button className={styles.rowActionBtn} onClick={() => openEdit(s)}>✏️</button>
                                            <button className={`${styles.rowActionBtn} ${styles.danger}`} onClick={() => deleteItem(s._id)}>🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} style={{ width: '560px' }} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>{editingId ? 'Sửa NCC' : 'Thêm NCC mới'}</h2>
                            <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Tên nhà cung cấp *</label>
                                <input type="text" name="name" className={styles.formInput} value={formData.name} onChange={handleInputChange} placeholder="VD: Akko Official" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Người liên hệ</label>
                                    <input type="text" name="contact" className={styles.formInput} value={formData.contact} onChange={handleInputChange} placeholder="Nguyễn Văn A" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Số điện thoại</label>
                                    <input type="tel" name="phone" className={styles.formInput} value={formData.phone} onChange={handleInputChange} placeholder="0901234567" />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Email</label>
                                <input type="email" name="email" className={styles.formInput} value={formData.email} onChange={handleInputChange} placeholder="supplier@example.com" />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Địa chỉ</label>
                                <input type="text" name="address" className={styles.formInput} value={formData.address} onChange={handleInputChange} placeholder="123 ABC, Quận 1, TP.HCM" />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Điều khoản thanh toán</label>
                                <input type="text" name="paymentTerms" className={styles.formInput} value={formData.paymentTerms} onChange={handleInputChange} placeholder="COD, 30 ngày, ..." />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Ngân hàng</label>
                                    <input type="text" name="bankName" className={styles.formInput} value={formData.bankName} onChange={handleInputChange} placeholder="Vietcombank" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Số tài khoản</label>
                                    <input type="text" name="accountNumber" className={styles.formInput} value={formData.accountNumber} onChange={handleInputChange} placeholder="0123456789" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Chủ tài khoản</label>
                                    <input type="text" name="accountHolder" className={styles.formInput} value={formData.accountHolder} onChange={handleInputChange} placeholder="NGUYEN VAN A" />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Ghi chú</label>
                                <textarea name="notes" className={styles.formInput} style={{ minHeight: '60px', resize: 'vertical' }} value={formData.notes} onChange={handleInputChange} placeholder="Ghi chú thêm về NCC..." />
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>HỦY</button>
                            <button className={styles.saveBtn} onClick={saveItem}>LƯU</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
