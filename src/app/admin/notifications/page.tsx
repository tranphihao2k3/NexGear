'use client'
import { useState, useEffect, useCallback } from 'react'
import styles from './page.module.scss'
import { CyberpunkLoader, useToast } from '@/components/ui'

const TYPES = [
    { value: 'info', label: 'Thông tin', color: 'blue' },
    { value: 'success', label: 'Thành công', color: 'green' },
    { value: 'warning', label: 'Cảnh báo', color: 'orange' },
    { value: 'error', label: 'Lỗi', color: 'red' },
]

function formatDate(d: string) { return new Date(d).toLocaleString('vi-VN') }

export default function AdminNotificationsPage() {
    const { success, error } = useToast()
    const [notifications, setNotifications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [filterType, setFilterType] = useState('')
    const [formTitle, setFormTitle] = useState('')
    const [formMessage, setFormMessage] = useState('')
    const [formType, setFormType] = useState('info')
    const [formLink, setFormLink] = useState('')

    const fetchNotifications = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (filterType) params.set('type', filterType)
            params.set('limit', '100')
            const res = await fetch(`/api/notifications?${params}`)
            const json = await res.json()
            if (json.success) setNotifications(json.data)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }, [filterType])

    useEffect(() => { fetchNotifications() }, [fetchNotifications])

    const resetForm = () => { setFormTitle(''); setFormMessage(''); setFormType('info'); setFormLink('') }

    const openAdd = () => { resetForm(); setShowModal(true) }

    const handleSave = async () => {
        if (!formTitle || !formMessage) return error('Nhập tiêu đề và nội dung')
        setSaving(true)
        try {
            const payload = { title: formTitle, message: formMessage, type: formType, link: formLink || null }
            const res = await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            const json = await res.json()
            if (!json.success) throw new Error(json.error)
            success('Đã gửi thông báo')
            setShowModal(false); resetForm(); fetchNotifications()
        } catch (e: any) { error(e.message) }
        finally { setSaving(false) }
    }

    const handleDelete = async (n: any) => {
        if (!confirm('Xóa thông báo?')) return
        try {
            const res = await fetch(`/api/notifications/${n._id}`, { method: 'DELETE' })
            const json = await res.json()
            if (json.success) { success('Đã xóa'); fetchNotifications() }
            else error(json.error)
        } catch { error('Lỗi') }
    }

    const unreadCount = notifications.filter(n => !n.isRead).length

    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Thông báo</h1>
                    <select className={styles.filterSelect} value={filterType} onChange={e => setFilterType(e.target.value)}>
                        <option value="">Tất cả loại</option>
                        {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
                <button className={styles.addBtn} onClick={openAdd}>+ GỬI THÔNG BÁO</button>
            </div>
            <div className={styles.summary}>
                <div className={styles.summaryItem}><span className={styles.summaryLabel}>Tổng thông báo</span><span className={styles.summaryValue}>{notifications.length}</span></div>
                <div className={styles.summaryItem}><span className={styles.summaryLabel}>Chưa đọc</span><span className={`${styles.summaryValue} ${styles.orange}`}>{unreadCount}</span></div>
            </div>
            {loading ? <CyberpunkLoader message="Đang tải..." compact /> : notifications.length === 0 ? <div style={{textAlign:'center',padding:'40px',color:'rgba(255,255,255,0.5)'}}>Chưa có thông báo</div> : (
                <div className={styles.list}>
                    {notifications.map(n => (
                        <div key={n._id} className={`${styles.item} ${!n.isRead ? styles.unread : ''}`}>
                            <div className={`${styles.icon} ${styles[TYPES.find(t => t.value === n.type)?.color || 'blue']}`}>
                                {n.type === 'success' ? '✓' : n.type === 'warning' ? '⚠' : n.type === 'error' ? '✕' : 'ℹ'}
                            </div>
                            <div className={styles.content}>
                                <div className={styles.itemTitle}>{n.title}</div>
                                <div className={styles.message}>{n.message}</div>
                                <div className={styles.meta}>{formatDate(n.createdAt)}</div>
                            </div>
                            <button className={styles.deleteBtn} onClick={() => handleDelete(n)}>🗑️</button>
                        </div>
                    ))}
                </div>
            )}
            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}><span className={styles.modalTitle}>Gửi thông báo</span><button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button></div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}><label className={styles.formLabel}>Tiêu đề</label><input type="text" className={styles.formInput} value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Tiêu đề thông báo..." /></div>
                            <div className={styles.formGroup}><label className={styles.formLabel}>Nội dung</label><textarea className={styles.formTextarea} value={formMessage} onChange={e => setFormMessage(e.target.value)} placeholder="Nội dung..." rows={3} /></div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}><label className={styles.formLabel}>Loại</label><select className={styles.formInput} value={formType} onChange={e => setFormType(e.target.value)}>{TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                                <div className={styles.formGroup}><label className={styles.formLabel}>Link (tùy chọn)</label><input type="text" className={styles.formInput} value={formLink} onChange={e => setFormLink(e.target.value)} placeholder="/admin/..." /></div>
                            </div>
                        </div>
                        <div className={styles.modalFooter}><button className={styles.cancelBtn} onClick={() => setShowModal(false)} disabled={saving}>HỦY</button><button className={styles.saveBtn} onClick={handleSave} disabled={saving}>{saving ? 'Đang gửi...' : 'GỬI'}</button></div>
                    </div>
                </div>
            )}
        </>
    )
}
