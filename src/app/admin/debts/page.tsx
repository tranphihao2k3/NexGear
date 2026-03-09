'use client'
import { useState, useEffect, useCallback } from 'react'
import styles from './page.module.scss'
import { CyberpunkLoader, useToast } from '@/components/ui'

const STATUSES = [
    { value: 'pending', label: 'Chờ thanh toán', color: 'orange' },
    { value: 'partial', label: 'Thanh toán một phần', color: 'blue' },
    { value: 'paid', label: 'Đã thanh toán', color: 'green' },
    { value: 'overdue', label: 'Quá hạn', color: 'red' },
    { value: 'cancelled', label: 'Đã hủy', color: 'gray' },
]

function formatCurrency(v: number) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v) }
function formatDate(d: string | null) { return d ? new Date(d).toLocaleDateString('vi-VN') : '-' }

export default function AdminDebtsPage() {
    const { success, error } = useToast()
    const [debts, setDebts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [filterType, setFilterType] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [formType, setFormType] = useState('customer')
    const [formCustomer, setFormCustomer] = useState('')
    const [formSupplier, setFormSupplier] = useState('')
    const [formAmount, setFormAmount] = useState('')
    const [formPaid, setFormPaid] = useState('0')
    const [formDueDate, setFormDueDate] = useState('')
    const [formDesc, setFormDesc] = useState('')
    const [customers, setCustomers] = useState<any[]>([])
    const [suppliers, setSuppliers] = useState<any[]>([])

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (filterType) params.set('debtType', filterType)
            if (filterStatus) params.set('status', filterStatus)
            const [debtsRes, custRes, supRes] = await Promise.all([
                fetch(`/api/debts?${params}`),
                fetch('/api/customers?limit=100'),
                fetch('/api/suppliers?limit=100')
            ])
            const [debtsJson, custJson, supJson] = await Promise.all([debtsRes.json(), custRes.json(), supRes.json()])
            if (debtsJson.success) setDebts(debtsJson.data)
            if (custJson.success) setCustomers(custJson.data)
            if (supJson.success) setSuppliers(supJson.data)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }, [filterType, filterStatus])

    useEffect(() => { fetchData() }, [fetchData])

    const resetForm = () => {
        setEditingId(null); setFormType('customer'); setFormCustomer(''); setFormSupplier('')
        setFormAmount(''); setFormPaid('0'); setFormDueDate(''); setFormDesc('')
    }

    const openAdd = () => { resetForm(); setShowModal(true) }
    const openEdit = (d: any) => {
        setEditingId(d._id); setFormType(d.debtType)
        setFormCustomer(d.customer?._id || d.customer || '')
        setFormSupplier(d.supplier?._id || d.supplier || '')
        setFormAmount(d.totalAmount?.toString() || '')
        setFormPaid(d.paidAmount?.toString() || '0')
        setFormDueDate(d.dueDate ? new Date(d.dueDate).toISOString().slice(0,10) : '')
        setFormDesc(d.description || '')
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!formAmount) return error('Nhập số tiền')
        setSaving(true)
        try {
            const payload = {
                debtType: formType,
                customer: formType === 'customer' ? formCustomer : null,
                supplier: formType === 'supplier' ? formSupplier : null,
                totalAmount: parseFloat(formAmount),
                paidAmount: parseFloat(formPaid) || 0,
                dueDate: formDueDate ? new Date(formDueDate).toISOString() : null,
                description: formDesc,
            }
            const res = await fetch(editingId ? `/api/debts/${editingId}` : '/api/debts', {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const json = await res.json()
            if (!json.success) throw new Error(json.error)
            success(editingId ? 'Đã cập nhật' : 'Đã thêm')
            setShowModal(false); resetForm(); fetchData()
        } catch (e: any) { error(e.message) }
        finally { setSaving(false) }
    }

    const handleDelete = async (d: any) => {
        if (!confirm('Xóa công nợ?')) return
        try {
            const res = await fetch(`/api/debts/${d._id}`, { method: 'DELETE' })
            const json = await res.json()
            if (json.success) { success('Đã xóa'); fetchData() }
            else error(json.error)
        } catch { error('Lỗi') }
    }

    const totalDebt = debts.reduce((s,d) => s + (d.remainingAmount || 0), 0)
    const overdueCount = debts.filter(d => d.status === 'overdue').length

    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Quản lý công nợ</h1>
                    <select className={styles.filterSelect} value={filterType} onChange={e => setFilterType(e.target.value)}>
                        <option value="">Tất cả loại</option>
                        <option value="customer">Khách hàng</option>
                        <option value="supplier">Nhà cung cấp</option>
                    </select>
                    <select className={styles.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="">Tất cả trạng thái</option>
                        {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                </div>
                <button className={styles.addBtn} onClick={openAdd}>+ THÊM CÔNG NỢ</button>
            </div>
            <div className={styles.summary}>
                <div className={styles.summaryItem}><span className={styles.summaryLabel}>Tổng công nợ</span><span className={styles.summaryValue}>{formatCurrency(totalDebt)}</span></div>
                <div className={styles.summaryItem}><span className={styles.summaryLabel}>Quá hạn</span><span className={`${styles.summaryValue} ${styles.red}`}>{overdueCount}</span></div>
                <div className={styles.summaryItem}><span className={styles.summaryLabel}>Tổng bản ghi</span><span className={styles.summaryValue}>{debts.length}</span></div>
            </div>
            {loading ? <CyberpunkLoader message="Đang tải..." compact /> : debts.length === 0 ? <div style={{textAlign:'center',padding:'40px',color:'rgba(255,255,255,0.5)'}}>Chưa có công nợ</div> : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead><tr><th>Loại</th><th>Khách/NCC</th><th>Tổng tiền</th><th>Đã trả</th><th>Còn nợ</th><th>Hạn</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                        <tbody>
                            {debts.map(d => (
                                <tr key={d._id}>
                                    <td>{d.debtType === 'customer' ? 'Khách hàng' : 'Nhà cung cấp'}</td>
                                    <td>{d.customer?.name || d.supplier?.name || '-'}</td>
                                    <td className={styles.money}>{formatCurrency(d.totalAmount)}</td>
                                    <td className={styles.money}>{formatCurrency(d.paidAmount)}</td>
                                    <td className={styles.money}>{formatCurrency(d.remainingAmount)}</td>
                                    <td>{formatDate(d.dueDate)}</td>
                                    <td><span className={`${styles.badge} ${styles[STATUSES.find(s => s.value === d.status)?.color || 'gray']}`}>{STATUSES.find(s => s.value === d.status)?.label || d.status}</span></td>
                                    <td><div className={styles.actions}><button className={styles.actionBtn} onClick={() => openEdit(d)}>✏️</button><button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDelete(d)}>🗑️</button></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}><span className={styles.modalTitle}>{editingId ? 'Sửa công nợ' : 'Thêm công nợ'}</span><button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button></div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}><label className={styles.formLabel}>Loại</label><select className={styles.formInput} value={formType} onChange={e => setFormType(e.target.value)}><option value="customer">Khách hàng</option><option value="supplier">Nhà cung cấp</option></select></div>
                            {formType === 'customer' ? (
                                <div className={styles.formGroup}><label className={styles.formLabel}>Khách hàng</label><select className={styles.formInput} value={formCustomer} onChange={e => setFormCustomer(e.target.value)}><option value="">-- Chọn --</option>{customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
                            ) : (
                                <div className={styles.formGroup}><label className={styles.formLabel}>Nhà cung cấp</label><select className={styles.formInput} value={formSupplier} onChange={e => setFormSupplier(e.target.value)}><option value="">-- Chọn --</option>{suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}</select></div>
                            )}
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}><label className={styles.formLabel}>Tổng tiền</label><input type="number" className={styles.formInput} value={formAmount} onChange={e => setFormAmount(e.target.value)} /></div>
                                <div className={styles.formGroup}><label className={styles.formLabel}>Đã trả</label><input type="number" className={styles.formInput} value={formPaid} onChange={e => setFormPaid(e.target.value)} /></div>
                            </div>
                            <div className={styles.formGroup}><label className={styles.formLabel}>Hạn thanh toán</label><input type="date" className={styles.formInput} value={formDueDate} onChange={e => setFormDueDate(e.target.value)} /></div>
                            <div className={styles.formGroup}><label className={styles.formLabel}>Mô tả</label><textarea className={styles.formTextarea} value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={2} /></div>
                        </div>
                        <div className={styles.modalFooter}><button className={styles.cancelBtn} onClick={() => setShowModal(false)} disabled={saving}>HỦY</button><button className={styles.saveBtn} onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : editingId ? 'CẬP NHẬT' : 'LƯU'}</button></div>
                    </div>
                </div>
            )}
        </>
    )
}
