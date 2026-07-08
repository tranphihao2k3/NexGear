// ============================================================
// LTV — Admin Inventory Page (A04)
// ============================================================
'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import styles from './page.module.scss'
import { CyberpunkLoader } from '@/components/ui'

interface Product {
    _id: string
    name: string
    sku: string
    stock: number
    lowStockAlert: number
    images: string[]
}

interface InventoryLog {
    _id: string
    product: { _id: string; name: string; sku: string } | string
    type: string
    quantity: number
    stockBefore: number
    stockAfter: number
    note?: string
    createdBy?: { name: string } | string
    createdAt: string
}

function getStockLevel(stock: number, alert: number) {
    if (stock <= Math.ceil(alert * 0.3)) return 'critical'
    if (stock <= alert) return 'low'
    return 'ok'
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('vi-VN')
}

export default function AdminInventoryPage() {
    const qc = useQueryClient()
    const [filter, setFilter] = useState('all')
    const [showImport, setShowImport] = useState(false)
    const [importProduct, setImportProduct] = useState('')
    const [importQty, setImportQty] = useState('')
    const [importNote, setImportNote] = useState('')

    // ── React Query ──
    const { data: products = [], isPending: loading } = useQuery<Product[]>({
        queryKey: ['inventory'],
        queryFn: () => fetch('/api/products?limit=100&admin=true')
            .then(r => r.json()).then(d => d.data ?? []),
        staleTime: 1000 * 60 * 2,
    })
    const { data: logs = [] } = useQuery<InventoryLog[]>({
        queryKey: ['inventory', 'logs'],
        queryFn: () => fetch('/api/inventory?limit=20')
            .then(r => r.json()).then(d => d.data ?? []),
        staleTime: 1000 * 60,
    })

    const importMutation = useMutation({
        mutationFn: (data: { product: string; quantity: number; note: string }) =>
            fetch('/api/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, type: 'import', createdBy: '000000000000000000000000' }),
            }).then(r => r.json()),
        onSuccess: (json) => {
            if (json.success) {
                setShowImport(false)
                setImportProduct('')
                setImportQty('')
                setImportNote('')
                qc.invalidateQueries({ queryKey: ['inventory'] })
                qc.invalidateQueries({ queryKey: ['inventory', 'logs'] })
            } else {
                alert(json.error || 'Nhập hàng thất bại')
            }
        },
        onError: () => alert('Lỗi kết nối'),
    })
    const saving = importMutation.isPending

    const handleImport = () => {
        if (!importProduct || !importQty || parseInt(importQty) <= 0) {
            alert('Vui lòng chọn sản phẩm và nhập số lượng hợp lệ')
            return
        }
        importMutation.mutate({
            product: importProduct,
            quantity: parseInt(importQty),
            note: importNote || 'Nhập hàng',
        })
    }

    const filtered = products.filter((item) => {
        if (filter === 'all') return true
        const level = getStockLevel(item.stock, item.lowStockAlert || 10)
        if (filter === 'critical') return level === 'critical'
        if (filter === 'low') return level === 'low' || level === 'critical'
        return true
    })

    const lowCount = products.filter((p) => getStockLevel(p.stock, p.lowStockAlert || 10) !== 'ok').length
    const criticalCount = products.filter((p) => getStockLevel(p.stock, p.lowStockAlert || 10) === 'critical').length

    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Kho hàng</h1>
                </div>
                <button className={styles.importBtn} onClick={() => setShowImport(true)}>
                    + NHẬP HÀNG
                </button>
            </div>

            {/* Filter chips */}
            <div className={styles.filters}>
                {[
                    { key: 'all', label: `Tất cả (${products.length})` },
                    { key: 'low', label: `⚠ Sắp hết hàng (${lowCount})` },
                    { key: 'critical', label: `🔴 Cần nhập gấp (${criticalCount})` },
                ].map((f) => (
                    <button
                        key={f.key}
                        className={`${styles.filterChip} ${filter === f.key ? styles.active : ''}`}
                        onClick={() => setFilter(f.key)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Stock table */}
            <div className={styles.tableWrapper}>
                {loading ? (
                    <CyberpunkLoader message="Đang tải tồn kho..." compact />
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th>SKU</th>
                                <th>Tồn kho</th>
                                <th>Mức tồn</th>
                                <th>Cảnh báo</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.5)' }}>
                                        Không có sản phẩm nào
                                    </td>
                                </tr>
                            ) : filtered.map((item) => {
                                const alertLevel = item.lowStockAlert || 10
                                const maxDisplay = Math.max(alertLevel * 3, item.stock, 50)
                                const level = getStockLevel(item.stock, alertLevel)
                                return (
                                    <tr key={item._id}>
                                        <td>
                                            <div className={styles.productCell}>
                                                <span className={styles.productEmoji}>📦</span>
                                                <div>
                                                    <div className={styles.productName}>{item.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={styles.productSku}>{item.sku}</span>
                                        </td>
                                        <td>
                                            <span className={`${styles.stockQty} ${styles[level]}`}>
                                                {item.stock} / {maxDisplay}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.stockBar}>
                                                <div
                                                    className={`${styles.stockBarFill} ${styles[level]}`}
                                                    style={{ width: `${Math.min((item.stock / maxDisplay) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </td>
                                        <td>
                                            <span className={styles.date}>
                                                {level === 'critical' ? '🔴 Cần nhập gấp' : level === 'low' ? '⚠ Sắp hết' : '✅ Đủ'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className={styles.actionBtn}
                                                onClick={() => {
                                                    setImportProduct(item._id)
                                                    setShowImport(true)
                                                }}
                                            >
                                                NHẬP THÊM
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Import log */}
            <div className={styles.logSection}>
                <div className={styles.logTitle}>Lịch sử xuất/nhập kho</div>
                <div className={styles.logList}>
                    {logs.length === 0 ? (
                        <div style={{ padding: '16px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                            Chưa có lịch sử
                        </div>
                    ) : logs.map((log) => (
                        <div key={log._id} className={styles.logItem}>
                            <span className={styles.logDate}>{formatDate(log.createdAt)}</span>
                            <span className={styles.logAction}>
                                {typeof log.product === 'object' ? log.product.name : 'Sản phẩm'}
                                {log.note && ` — ${log.note}`}
                            </span>
                            <span className={`${styles.logQty} ${log.quantity > 0 ? styles.in : styles.out}`}>
                                {log.quantity > 0 ? '+' : ''}{log.quantity}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Import Modal */}
            {showImport && (
                <div className={styles.modalOverlay} onClick={() => setShowImport(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <span className={styles.modalTitle}>Nhập hàng</span>
                            <button className={styles.modalClose} onClick={() => setShowImport(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Sản phẩm</label>
                                <select
                                    className={styles.formInput}
                                    value={importProduct}
                                    onChange={(e) => setImportProduct(e.target.value)}
                                >
                                    <option value="">-- Chọn sản phẩm --</option>
                                    {products.map((item) => (
                                        <option key={item._id} value={item._id}>
                                            {item.name} ({item.sku}) — Tồn: {item.stock}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Số lượng nhập</label>
                                <input
                                    type="number"
                                    className={styles.formInput}
                                    placeholder="0"
                                    value={importQty}
                                    onChange={(e) => setImportQty(e.target.value)}
                                    min="1"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Ghi chú</label>
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    placeholder="Lý do nhập hàng..."
                                    value={importNote}
                                    onChange={(e) => setImportNote(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setShowImport(false)}>HỦY</button>
                            <button className={styles.saveBtn} onClick={handleImport} disabled={saving}>
                                {saving ? 'Đang xử lý...' : '✓ XÁC NHẬN NHẬP'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
