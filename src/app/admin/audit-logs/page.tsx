'use client'
import { useState, useEffect, useCallback } from 'react'
import styles from './page.module.scss'
import { CyberpunkLoader } from '@/components/ui'

const ACTIONS = [
    { value: 'create', label: 'Tạo mới', color: 'green' },
    { value: 'update', label: 'Cập nhật', color: 'blue' },
    { value: 'delete', label: 'Xóa', color: 'red' },
]

function formatDate(d: string) { return new Date(d).toLocaleString('vi-VN') }

export default function AdminAuditLogsPage() {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filterAction, setFilterAction] = useState('')
    const [filterCollection, setFilterCollection] = useState('')
    const [search, setSearch] = useState('')

    const fetchLogs = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (filterAction) params.set('action', filterAction)
            if (filterCollection) params.set('collectionName', filterCollection)
            if (search) params.set('search', search)
            params.set('limit', '100')
            const res = await fetch(`/api/audit-logs?${params}`)
            const json = await res.json()
            if (json.success) setLogs(json.data)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }, [filterAction, filterCollection, search])

    useEffect(() => { fetchLogs() }, [fetchLogs])

    const collections = [...new Set(logs.map(l => l.collectionName))]

    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Audit Logs</h1>
                    <input type="text" className={styles.searchInput} placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} />
                    <select className={styles.filterSelect} value={filterAction} onChange={e => setFilterAction(e.target.value)}>
                        <option value="">Tất cả hành động</option>
                        {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </select>
                    <select className={styles.filterSelect} value={filterCollection} onChange={e => setFilterCollection(e.target.value)}>
                        <option value="">Tất cả bảng</option>
                        {collections.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>
            <div className={styles.summary}>
                <div className={styles.summaryItem}><span className={styles.summaryLabel}>Tổng logs</span><span className={styles.summaryValue}>{logs.length}</span></div>
                <div className={styles.summaryItem}><span className={styles.summaryLabel}>Tạo mới</span><span className={`${styles.summaryValue} ${styles.green}`}>{logs.filter(l => l.action === 'create').length}</span></div>
                <div className={styles.summaryItem}><span className={styles.summaryLabel}>Cập nhật</span><span className={`${styles.summaryValue} ${styles.blue}`}>{logs.filter(l => l.action === 'update').length}</span></div>
                <div className={styles.summaryItem}><span className={styles.summaryLabel}>Xóa</span><span className={`${styles.summaryValue} ${styles.red}`}>{logs.filter(l => l.action === 'delete').length}</span></div>
            </div>
            {loading ? <CyberpunkLoader message="Đang tải..." compact /> : logs.length === 0 ? <div style={{textAlign:'center',padding:'40px',color:'rgba(255,255,255,0.5)'}}>Chưa có logs</div> : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead><tr><th>Thời gian</th><th>Người dùng</th><th>Bảng</th><th>Hành động</th><th>Mô tả</th><th>IP</th></tr></thead>
                        <tbody>
                            {logs.map(l => (
                                <tr key={l._id}>
                                    <td className={styles.date}>{formatDate(l.createdAt)}</td>
                                    <td>{l.user?.name || l.user?.email || '-'}</td>
                                    <td><span className={styles.collection}>{l.collectionName}</span></td>
                                    <td><span className={`${styles.badge} ${styles[ACTIONS.find(a => a.value === l.action)?.color || 'gray']}`}>{ACTIONS.find(a => a.value === l.action)?.label || l.action}</span></td>
                                    <td className={styles.desc}>{l.description || '-'}</td>
                                    <td className={styles.mono}>{l.ipAddress || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    )
}
