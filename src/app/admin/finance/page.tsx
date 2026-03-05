// ============================================================
// NEXGEAR — Admin Finance Page (A05)
// ============================================================
'use client'

import { useState, useEffect, useCallback } from 'react'
import styles from './page.module.scss'
import { CyberpunkLoader } from '@/components/ui'
import { downloadCsv, toCsv } from '@/lib/csv'

interface Transaction {
    _id: string
    type: string
    category: string
    amount: number
    direction: string
    description: string
    date: string
    paymentMethod?: string
    orderId?: { orderCode: string } | string
    createdBy?: { name: string } | string
    createdAt: string
}

const CATEGORY_MAP: Record<string, string> = {
    shipping_fee: 'Vận chuyển',
    import_cost: 'Nhập hàng',
    salary: 'Nhân sự',
    rent: 'Thuê mặt bằng',
    marketing: 'Marketing',
    tool: 'Công cụ',
    product_sale: 'Bán hàng',
    other: 'Khác',
}

const CATEGORY_OPTIONS = [
    { value: 'shipping_fee', label: 'Vận chuyển' },
    { value: 'import_cost', label: 'Nhập hàng' },
    { value: 'rent', label: 'Thuê mặt bằng' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'salary', label: 'Nhân sự' },
    { value: 'other', label: 'Khác' },
]

function formatVND(amount: number) {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`
    return `${amount}đ`
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('vi-VN')
}

export default function AdminFinancePage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [showExpense, setShowExpense] = useState(false)
    const [saving, setSaving] = useState(false)

    // Expense form
    const [expDesc, setExpDesc] = useState('')
    const [expAmount, setExpAmount] = useState('')
    const [expCategory, setExpCategory] = useState('shipping_fee')
    const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0])

    // Computed summaries
    const [totalRevenue, setTotalRevenue] = useState(0)
    const [totalExpense, setTotalExpense] = useState(0)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/transactions?limit=50')
            const json = await res.json()
            if (json.success) {
                setTransactions(json.data)
                const revenue = json.data
                    .filter((t: Transaction) => t.direction === 'in')
                    .reduce((sum: number, t: Transaction) => sum + t.amount, 0)
                const expense = json.data
                    .filter((t: Transaction) => t.direction === 'out')
                    .reduce((sum: number, t: Transaction) => sum + t.amount, 0)
                setTotalRevenue(revenue)
                setTotalExpense(expense)
            }
        } catch (err) {
            console.error('Failed to fetch transactions:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    const handleAddExpense = async () => {
        if (!expDesc || !expAmount || parseInt(expAmount) <= 0) {
            alert('Vui lòng nhập đầy đủ thông tin')
            return
        }
        setSaving(true)
        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'expense',
                    category: expCategory,
                    amount: parseInt(expAmount),
                    direction: 'out',
                    description: expDesc,
                    date: expDate,
                    paymentMethod: 'bank_transfer',
                    createdBy: '000000000000000000000000',
                }),
            })
            const json = await res.json()
            if (json.success) {
                setShowExpense(false)
                setExpDesc('')
                setExpAmount('')
                setExpCategory('shipping_fee')
                fetchData()
            } else {
                alert(json.error || 'Thêm chi phí thất bại')
            }
        } catch {
            alert('Lỗi kết nối')
        } finally {
            setSaving(false)
        }
    }

    // Group transactions by month for chart
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const month = `T${i + 1}`
        const monthTxs = transactions.filter((t) => {
            const d = new Date(t.date)
            return d.getMonth() === i
        })
        const revenue = monthTxs.filter((t) => t.direction === 'in').reduce((s, t) => s + t.amount, 0)
        const expense = monthTxs.filter((t) => t.direction === 'out').reduce((s, t) => s + t.amount, 0)
        return { month, revenue: revenue / 1000000, expense: expense / 1000000 }
    })

    const maxVal = Math.max(...monthlyData.map((d) => d.revenue + d.expense), 1)
    const profit = totalRevenue - totalExpense

    const handleExportFinance = () => {
        const rows = monthlyData.map((item) => ({
            thang: item.month,
            doanh_thu_vnd: Math.round(item.revenue * 1000000),
            chi_phi_vnd: Math.round(item.expense * 1000000),
            loi_nhuan_vnd: Math.round((item.revenue - item.expense) * 1000000),
        }))

        if (rows.length === 0) {
            alert('Không có dữ liệu tài chính để xuất')
            return
        }

        const csv = toCsv(rows)
        downloadCsv(`finance-pnl-${new Date().toISOString().slice(0, 10)}.csv`, csv)
    }

    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Tài chính</h1>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.actionBtn} onClick={() => setShowExpense(true)}>
                        + GHI CHI PHÍ
                    </button>
                    <button className={`${styles.actionBtn} ${styles.primary}`} onClick={handleExportFinance}>
                        📥 XUẤT EXCEL
                    </button>
                </div>
            </div>

            {/* P&L Summary */}
            <div className={styles.summaryGrid}>
                <div className={`${styles.summaryCard} ${styles.revenue}`}>
                    <div className={styles.summaryLabel}>TỔNG DOANH THU</div>
                    <div className={`${styles.summaryValue} ${styles.revenue}`}>
                        {loading ? '...' : `${formatVND(totalRevenue)} đ`}
                    </div>
                </div>
                <div className={`${styles.summaryCard} ${styles.expense}`}>
                    <div className={styles.summaryLabel}>TỔNG CHI PHÍ</div>
                    <div className={`${styles.summaryValue} ${styles.expense}`}>
                        {loading ? '...' : `${formatVND(totalExpense)} đ`}
                    </div>
                </div>
                <div className={`${styles.summaryCard} ${styles.profit}`}>
                    <div className={styles.summaryLabel}>LỢI NHUẬN</div>
                    <div className={`${styles.summaryValue} ${styles.profit}`}>
                        {loading ? '...' : `${formatVND(profit)} đ`}
                    </div>
                </div>
            </div>

            {/* Revenue vs Expense Chart */}
            <div className={styles.chartSection}>
                <div className={styles.chartHeader}>
                    <div className={styles.chartTitle}>Doanh thu vs Chi phí</div>
                    <div className={styles.chartLegend}>
                        <div className={styles.legendItem}>
                            <span className={styles.legendDot} style={{ background: '#00C4AD' }} />
                            Doanh thu
                        </div>
                        <div className={styles.legendItem}>
                            <span className={styles.legendDot} style={{ background: '#F0356A' }} />
                            Chi phí
                        </div>
                    </div>
                </div>
                <div className={styles.stackedChart}>
                    {monthlyData.map((d) => (
                        <div key={d.month} className={styles.stackedBar}>
                            <div
                                className={`${styles.barSegment} ${styles.expense}`}
                                style={{ height: `${maxVal > 0 ? (d.expense / maxVal) * 100 : 0}%` }}
                                title={`Chi phí: ${d.expense.toFixed(1)}M`}
                            />
                            <div
                                className={`${styles.barSegment} ${styles.revenue}`}
                                style={{ height: `${maxVal > 0 ? (d.revenue / maxVal) * 100 : 0}%` }}
                                title={`Doanh thu: ${d.revenue.toFixed(1)}M`}
                            />
                        </div>
                    ))}
                </div>
                <div className={styles.chartLabels}>
                    {monthlyData.map((d) => (
                        <span key={d.month}>{d.month}</span>
                    ))}
                </div>
            </div>

            {/* Transactions */}
            <div className={styles.tableSection}>
                <div className={styles.tableHeader}>
                    <span className={styles.tableTitle}>Giao dịch gần đây</span>
                </div>
                {loading ? (
                    <CyberpunkLoader message="Đang tải báo cáo tài chính..." compact />
                ) : transactions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.5)' }}>
                        Chưa có giao dịch nào
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Ngày</th>
                                <th>Mô tả</th>
                                <th>Loại</th>
                                <th>Số tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((tx) => {
                                const isIncome = tx.direction === 'in'
                                const category = isIncome ? 'income' : 'expense'
                                return (
                                    <tr key={tx._id}>
                                        <td><span className={styles.txDate}>{formatDate(tx.date)}</span></td>
                                        <td>
                                            <span className={styles.txDesc}>
                                                {tx.description}
                                                {tx.orderId && typeof tx.orderId === 'object' && ` (${tx.orderId.orderCode})`}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`${styles.txCategory} ${styles[category]}`}>
                                                {isIncome ? 'THU' : 'CHI'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`${styles.txAmount} ${styles[category]}`}>
                                                {isIncome ? '+' : '-'}{formatVND(tx.amount)}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Expense Modal */}
            {showExpense && (
                <div className={styles.modalOverlay} onClick={() => setShowExpense(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <span className={styles.modalTitle}>Ghi chi phí</span>
                            <button className={styles.modalClose} onClick={() => setShowExpense(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Mô tả</label>
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    placeholder="VD: Phí vận chuyển GHTK"
                                    value={expDesc}
                                    onChange={(e) => setExpDesc(e.target.value)}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Số tiền (VNĐ)</label>
                                <input
                                    type="number"
                                    className={styles.formInput}
                                    placeholder="VD: 125000"
                                    value={expAmount}
                                    onChange={(e) => setExpAmount(e.target.value)}
                                    min="1"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Danh mục</label>
                                <select
                                    className={styles.formInput}
                                    value={expCategory}
                                    onChange={(e) => setExpCategory(e.target.value)}
                                >
                                    {CATEGORY_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Ngày</label>
                                <input
                                    type="date"
                                    className={styles.formInput}
                                    value={expDate}
                                    onChange={(e) => setExpDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setShowExpense(false)}>HỦY</button>
                            <button className={styles.saveBtn} onClick={handleAddExpense} disabled={saving}>
                                {saving ? 'Đang lưu...' : '💾 LƯU CHI PHÍ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
