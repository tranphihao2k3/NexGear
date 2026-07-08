// ============================================================
// LTV — Admin Dashboard Page (A01)
// File: app/admin/page.tsx
// 4 KPI cards, Revenue chart, Channel donut, Recent orders,
// Low stock alerts — all connected to real API
// ============================================================
'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import styles from './page.module.scss'
import { CyberpunkLoader } from '@/components/ui'
import { downloadCsv, toCsv } from '@/lib/csv'

// ── TYPES ───────────────────────────────────────────────────
interface DashboardData {
    kpis: {
        revenue: number
        revenueChange: number
        orders: number
        orderChange: number
        avgOrderValue: number
        lowStockCount: number
    }
    revenueChart: { label: string; value: number }[]
    channels: { label: string; value: number; count: number; color: string }[]
    totalOrders: number
    recentOrders: {
        _id: string
        orderCode: string
        customer: string
        product: string
        amount: number
        status: string
    }[]
    lowStock: {
        _id: string
        name: string
        sku: string
        stock: number
        level: 'critical' | 'low'
    }[]
}

const STATUS_LABELS: Record<string, string> = {
    pending: 'Chờ xử lý',
    confirmed: 'Đã xác nhận',
    packing: 'Đang đóng gói',
    shipped: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy',
    refunded: 'Đã hoàn',
}

// ── HELPER ──────────────────────────────────────────────────
function getMonth() {
    const months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    const now = new Date()
    return `Tháng ${months[now.getMonth()]}/${now.getFullYear()}`
}

function formatVND(amount: number) {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`
    return `${amount}đ`
}

function buildConicGradient(data: { value: number; color: string }[]) {
    if (data.length === 0) return 'conic-gradient(rgba(255,255,255,0.1) 0% 100%)'
    let cumulative = 0
    const segments = data.map((d) => {
        const start = cumulative
        cumulative += d.value
        return `${d.color} ${start}% ${cumulative}%`
    })
    return `conic-gradient(${segments.join(', ')})`
}

// ── PAGE ────────────────────────────────────────────────────
export default function AdminDashboardPage() {
    const { data, isPending, isError } = useQuery<DashboardData>({
        queryKey: ['dashboard'],
        queryFn: () => fetch('/api/dashboard').then(r => r.json()).then(d => {
            if (!d.success) throw new Error(d.error || 'Lỗi tải dashboard')
            return d.data
        }),
        staleTime: 1000 * 60 * 5,           // 5 phút
        refetchInterval: 1000 * 60 * 5,     // auto-refresh mỗi 5 phút
    })

    if (isPending) {
        return <CyberpunkLoader message="Đang tải dashboard..." />
    }

    if (isError || !data) {
        return (
            <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.5)' }}>
                Không thể tải dữ liệu dashboard
            </div>
        )
    }

    const { kpis, revenueChart, channels, totalOrders, recentOrders, lowStock } = data
    const maxRevenue = Math.max(...revenueChart.map((d) => d.value), 1)

    const handleExportDashboard = () => {
        const rows = [
            {
                muc: 'doanh_thu',
                gia_tri: kpis.revenue,
                ghi_chu: `thay_doi_${kpis.revenueChange}%`,
            },
            {
                muc: 'don_hang',
                gia_tri: kpis.orders,
                ghi_chu: `thay_doi_${kpis.orderChange}`,
            },
            {
                muc: 'gia_tri_trung_binh_don',
                gia_tri: kpis.avgOrderValue,
                ghi_chu: '',
            },
            {
                muc: 'sap_het_kho',
                gia_tri: kpis.lowStockCount,
                ghi_chu: '',
            },
            ...revenueChart.map((item) => ({
                muc: `doanh_thu_${item.label}`,
                gia_tri: item.value,
                ghi_chu: 'don_vi_trieu_vnd',
            })),
            ...channels.map((item) => ({
                muc: `kenh_${item.label}`,
                gia_tri: item.count,
                ghi_chu: `${item.value}%`,
            })),
            ...lowStock.map((item) => ({
                muc: `sap_het_${item.sku}`,
                gia_tri: item.stock,
                ghi_chu: item.level,
            })),
        ]

        const csv = toCsv(rows)
        downloadCsv(`dashboard-report-${new Date().toISOString().slice(0, 10)}.csv`, csv)
    }

    const KPI_DATA = [
        {
            label: 'DOANH THU',
            value: formatVND(kpis.revenue),
            unit: 'đ',
            trend: kpis.revenueChange >= 0 ? `+${kpis.revenueChange}%` : `${kpis.revenueChange}%`,
            trendDir: kpis.revenueChange >= 0 ? 'up' : 'down',
            color: 'cyan',
        },
        {
            label: 'ĐƠN HÀNG',
            value: String(kpis.orders),
            unit: '',
            trend: kpis.orderChange >= 0 ? `+${kpis.orderChange}` : `${kpis.orderChange}`,
            trendDir: kpis.orderChange >= 0 ? 'up' : 'down',
            color: 'magenta',
        },
        {
            label: 'GIÁ TRỊ TB/ĐƠN',
            value: formatVND(kpis.avgOrderValue),
            unit: '',
            trend: '',
            trendDir: 'up',
            color: 'gold',
        },
        {
            label: 'SẮP HẾT KHO',
            value: String(kpis.lowStockCount),
            unit: '',
            trend: kpis.lowStockCount > 0 ? 'Cần nhập' : 'Đủ hàng',
            trendDir: kpis.lowStockCount > 0 ? 'warning' : 'up',
            color: 'purple',
        },
    ]

    return (
        <>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Dashboard — {getMonth()}</h1>
                </div>
                <button className={styles.exportBtn} onClick={handleExportDashboard}>XUẤT BÁO CÁO</button>
            </div>

            {/* KPI Row */}
            <div className={styles.kpiGrid}>
                {KPI_DATA.map((kpi) => (
                    <div key={kpi.label} className={`${styles.kpiCard} ${styles[kpi.color]}`}>
                        <div className={styles.kpiLabel}>{kpi.label}</div>
                        <div className={`${styles.kpiValue} ${styles[kpi.color]}`}>
                            {kpi.value}
                            {kpi.unit && <span className={styles.kpiUnit}> {kpi.unit}</span>}
                        </div>
                        {kpi.trend && (
                            <div className={`${styles.kpiTrend} ${styles[kpi.trendDir]}`}>
                                <span className={styles.trendIcon}>
                                    {{ up: '↑', down: '↓', warning: '⚠' }[kpi.trendDir]}
                                </span>
                                {kpi.trend}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className={styles.chartsGrid}>
                {/* Revenue Chart */}
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <div className={styles.chartTitle}>Biểu đồ doanh thu</div>
                        <div className={styles.chartPeriod}>{new Date().getFullYear()}</div>
                    </div>
                    <div className={styles.lineChart}>
                        <div className={styles.chartBars}>
                            {revenueChart.map((d) => (
                                <div
                                    key={d.label}
                                    className={`${styles.chartBar} ${styles.revenue}`}
                                    style={{ height: `${(d.value / maxRevenue) * 100}%` }}
                                    title={`${d.label}: ${d.value}M`}
                                />
                            ))}
                        </div>
                        <div className={styles.chartLabels}>
                            {revenueChart.map((d) => (
                                <span key={d.label}>{d.label}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Channel Donut */}
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <div className={styles.chartTitle}>Kênh bán hàng</div>
                    </div>
                    <div className={styles.donutWrapper}>
                        <div
                            className={styles.donut}
                            style={{ background: buildConicGradient(channels) }}
                        >
                            <div className={styles.donutCenter}>
                                <span className={styles.donutTotal}>{totalOrders}</span>
                                <span className={styles.donutLabel}>đơn</span>
                            </div>
                        </div>
                        <div className={styles.donutLegend}>
                            {channels.length === 0 ? (
                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Chưa có dữ liệu</div>
                            ) : channels.map((d) => (
                                <div key={d.label} className={styles.legendItem}>
                                    <span className={styles.legendDot} style={{ background: d.color }} />
                                    {d.label} ({d.value}%)
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom: Recent Orders + Low Stock */}
            <div className={styles.bottomGrid}>
                {/* Recent Orders */}
                <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionTitle}>Đơn hàng gần đây</span>
                        <Link href="/admin/orders" className={styles.viewAllLink}>
                            Xem tất cả →
                        </Link>
                    </div>
                    {recentOrders.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                            Chưa có đơn hàng
                        </div>
                    ) : (
                        <table className={styles.ordersTable}>
                            <thead>
                                <tr>
                                    <th>Mã đơn</th>
                                    <th>Khách hàng</th>
                                    <th>Tổng</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map((order) => (
                                    <tr key={order._id}>
                                        <td>
                                            <span className={styles.orderId}>{order.orderCode}</span>
                                        </td>
                                        <td>
                                            <span className={styles.orderCustomer}>{order.customer}</span>
                                        </td>
                                        <td>
                                            <span className={styles.orderAmount}>{formatVND(order.amount)}</span>
                                        </td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[order.status]}`}>
                                                {STATUS_LABELS[order.status] || order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Low Stock Alerts */}
                <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionTitle}>⚠ Sắp hết hàng</span>
                        <Link href="/admin/inventory" className={styles.viewAllLink}>
                            Xem kho →
                        </Link>
                    </div>
                    {lowStock.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                            Tất cả sản phẩm đều đủ hàng
                        </div>
                    ) : (
                        <div className={styles.stockList}>
                            {lowStock.map((item) => (
                                <div key={item._id} className={styles.stockItem}>
                                    <div className={styles.stockImage}>
                                        <span className={styles.stockEmoji}>📦</span>
                                    </div>
                                    <div className={styles.stockInfo}>
                                        <div className={styles.stockName}>{item.name}</div>
                                        <div className={styles.stockSku}>{item.sku}</div>
                                    </div>
                                    <span className={`${styles.stockCount} ${styles[item.level]}`}>
                                        Còn {item.stock}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
