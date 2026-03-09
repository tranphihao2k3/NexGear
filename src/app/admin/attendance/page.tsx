'use client'
import { useState, useEffect, useCallback } from 'react'
import styles from './page.module.scss'
import { CyberpunkLoader, useToast } from '@/components/ui'

const STATUSES = [
    { value: 'present', label: 'Có mặt', color: 'green' },
    { value: 'absent', label: 'Vắng', color: 'red' },
    { value: 'late', label: 'Muộn', color: 'orange' },
    { value: 'leave', label: 'Nghỉ phép', color: 'blue' },
    { value: 'holiday', label: 'Ngày lễ', color: 'purple' },
]

function formatDate(d: string | null) { return d ? new Date(d).toLocaleDateString('vi-VN') : '-' }
function formatTime(d: string | null) { return d ? new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-' }

export default function AdminAttendancePage() {
    const { success, error } = useToast()
    const [records, setRecords] = useState<any[]>([])
    const [employees, setEmployees] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0,10))
    const [filterStatus, setFilterStatus] = useState('')
    const [formEmployee, setFormEmployee] = useState('')
    const [formDate, setFormDate] = useState(new Date().toISOString().slice(0,10))
    const [formCheckIn, setFormCheckIn] = useState('')
    const [formCheckOut, setFormCheckOut] = useState('')
    const [formStatus, setFormStatus] = useState('present')
    const [formReason, setFormReason] = useState('')

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (filterDate) params.set('date', filterDate)
            if (filterStatus) params.set('status', filterStatus)
            const [attRes, empRes] = await Promise.all([
                fetch(`/api/attendance?${params}`),
                fetch('/api/users?role=staff&limit=100')
            ])
            const [attJson, empJson] = await Promise.all([attRes.json(), empRes.json()])
            if (attJson.success) setRecords(attJson.data)
            if (empJson.success) setEmployees(empJson.data)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }, [filterDate, filterStatus])

    useEffect(() => { fetchData() }, [fetchData])

    const resetForm = () => {
        setEditingId(null); setFormEmployee(''); setFormDate(new Date().toISOString().slice(0,10))
        setFormCheckIn(''); setFormCheckOut(''); setFormStatus('present'); setFormReason('')
    }

    const openAdd = () => { resetForm(); setShowModal(true) }
    const openEdit = (r: any) => {
        setEditingId(r._id); setFormEmployee(r.employee?._id || r.employee || '')
        setFormDate(r.date ? new Date(r.date).toISOString().slice(0,10) : '')
        setFormCheckIn(r.checkIn ? new Date(r.checkIn).toISOString().slice(0,16) : '')
        setFormCheckOut(r.checkOut ? new Date(r.checkOut).toISOString().slice(0,16) : '')
        setFormStatus(r.status); setFormReason(r.reason || '')
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!formEmployee || !formDate) return error('Nhập đầy đủ thông tin')
        setSaving(true)
        try {
            const payload = {
                employee: formEmployee, date: new Date(formDate).toISOString(),
                checkIn: formCheckIn ? new Date(formCheckIn).toISOString() : null,
                checkOut: formCheckOut ? new Date(formCheckOut).toISOString() : null,
                status: formStatus, reason: formReason,
            }
            const res = await fetch(editingId ? `/api/attendance/${editingId}` : '/api/attendance', {
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

    const handleDelete = async (r: any) => {
        if (!confirm('Xóa bản ghi?')) return
        try {
            const res = await fetch(`/api/attendance/${r._id}`, { method: 'DELETE' })
            const json = await res.json()
            if (json.success) { success('Đã xóa'); fetchData() }
            else error(json.error)
        } catch { error('Lỗi') }
    }

    const presentCount = records.filter(r => r.status === 'present').length
    const lateCount = records.filter(r => r.status === 'late').length
    const absentCount = records.filter(r => r.status === 'absent').length

    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Chấm công</h1>
                    <input type="date" className={styles.filterInput} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                    <select className={styles.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="">Tất cả trạng thái</option>
                        {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                </div>
                <button className={styles.addBtn} onClick={openAdd}>+ THÊM</button>
            </div>
            <div className={styles.summary}>
                <div className={styles.summaryItem}><span className={styles.summaryLabel}>Tổng nhân viên</span><span className={styles.summaryValue}>{records.length}</span></div>
                <div className={styles.summaryItem}><span className={styles.summaryLabel}>Có mặt</span><span className={`${styles.summaryValue} ${styles.green}`}>{presentCount}</span></div>
                <div className={styles.summaryItem}><span className={styles.summaryLabel}>Muộn</span><span className={`${styles.summaryValue} ${styles.orange}`}>{lateCount}</span></div>
                <div className={styles.summaryItem}><span className={styles.summaryLabel}>Vắng</span><span className={`${styles.summaryValue} ${styles.red}`}>{absentCount}</span></div>
            </div>
            {loading ? <CyberpunkLoader message="Đang tải..." compact /> : records.length === 0 ? <div style={{textAlign:'center',padding:'40px',color:'rgba(255,255,255,0.5)'}}>Chưa có dữ liệu</div> : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead><tr><th>Nhân viên</th><th>Ngày</th><th>Check in</th><th>Check out</th><th>Trạng thái</th><th>Ghi chú</th><th>Thao tác</th></tr></thead>
                        <tbody>
                            {records.map(r => (
                                <tr key={r._id}>
                                    <td>{r.employee?.name || r.employee?.firstName || '-'}</td>
                                    <td>{formatDate(r.date)}</td>
                                    <td>{formatTime(r.checkIn)}</td>
                                    <td>{formatTime(r.checkOut)}</td>
                                    <td><span className={`${styles.badge} ${styles[STATUSES.find(s => s.value === r.status)?.color || 'gray']}`}>{STATUSES.find(s => s.value === r.status)?.label || r.status}</span></td>
                                    <td>{r.reason || '-'}</td>
                                    <td><div className={styles.actions}><button className={styles.actionBtn} onClick={() => openEdit(r)}>✏️</button><button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDelete(r)}>🗑️</button></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}><span className={styles.modalTitle}>{editingId ? 'Sửa chấm công' : 'Thêm chấm công'}</span><button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button></div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}><label className={styles.formLabel}>Nhân viên</label><select className={styles.formInput} value={formEmployee} onChange={e => setFormEmployee(e.target.value)}><option value="">-- Chọn --</option>{employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}</select></div>
                            <div className={styles.formGroup}><label className={styles.formLabel}>Ngày</label><input type="date" className={styles.formInput} value={formDate} onChange={e => setFormDate(e.target.value)} /></div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}><label className={styles.formLabel}>Check in</label><input type="datetime-local" className={styles.formInput} value={formCheckIn} onChange={e => setFormCheckIn(e.target.value)} /></div>
                                <div className={styles.formGroup}><label className={styles.formLabel}>Check out</label><input type="datetime-local" className={styles.formInput} value={formCheckOut} onChange={e => setFormCheckOut(e.target.value)} /></div>
                            </div>
                            <div className={styles.formGroup}><label className={styles.formLabel}>Trạng thái</label><select className={styles.formInput} value={formStatus} onChange={e => setFormStatus(e.target.value)}>{STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
                            <div className={styles.formGroup}><label className={styles.formLabel}>Ghi chú</label><input type="text" className={styles.formInput} value={formReason} onChange={e => setFormReason(e.target.value)} /></div>
                        </div>
                        <div className={styles.modalFooter}><button className={styles.cancelBtn} onClick={() => setShowModal(false)} disabled={saving}>HỦY</button><button className={styles.saveBtn} onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : editingId ? 'CẬP NHẬT' : 'LƯU'}</button></div>
                    </div>
                </div>
            )}
        </>
    )
}
