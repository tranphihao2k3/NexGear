// ============================================================
// NEXGEAR — Admin Orders Page (A02)
// File: app/admin/orders/page.tsx
// Table + status filter tabs + search + detail drawer
// ============================================================
'use client'

import { useState, useEffect, useCallback } from 'react'
import styles from './page.module.scss'

// ── TYPES ───────────────────────────────────────────────────
type OrderStatus = 'pending' | 'confirmed' | 'packing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

interface OrderItem {
    product: { _id: string; name: string; slug: string; images: string[] } | string
    variant?: string
    qty: number
    unitPrice: number
    totalPrice: number
}

interface Order {
    _id: string
    orderCode: string
    channel: string
    user?: { _id: string; name: string; email: string }
    customerInfo: { name: string; phone: string; email: string }
    items: OrderItem[]
    subtotal: number
    discount: number
    shippingFee: number
    total: number
    status: OrderStatus
    payment: { method: string; status: string; txnId?: string; paidAt?: string }
    shipping: { provider?: string; trackingCode?: string; estimatedAt?: string }
    shippingAddress?: { address: string; ward: string; district: string; province: string }
    timeline: { status: string; note: string; updatedAt: string }[]
    staffNotes?: string
    createdAt: string
}

interface Pagination {
    total: number
    page: number
    limit: number
    totalPages: number
}

// ── CONSTANTS ───────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    packing: 'Đang đóng gói',
    shipped: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy',
    refunded: 'Đã hoàn',
}

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
    { value: 'pending', label: '⏳ Chờ xác nhận' },
    { value: 'confirmed', label: '✅ Đã xác nhận' },
    { value: 'packing', label: '📦 Đang đóng gói' },
    { value: 'shipped', label: '🚚 Đang giao' },
    { value: 'delivered', label: '✅ Đã giao' },
    { value: 'cancelled', label: '❌ Đã hủy' },
    { value: 'refunded', label: '↩️ Đã hoàn' },
]

function formatVND(amount: number) {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`
    return `${amount}đ`
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('vi-VN')
}

// ── PAGE ────────────────────────────────────────────────────
export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 1 })
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(true)

    const [activeTab, setActiveTab] = useState('all')
    const [selectedOrders, setSelectedOrders] = useState<string[]>([])
    const [search, setSearch] = useState('')
    const [searchDebounce, setSearchDebounce] = useState('')
    const [page, setPage] = useState(1)
    const [drawerOrder, setDrawerOrder] = useState<Order | null>(null)
    const [drawerStatus, setDrawerStatus] = useState<OrderStatus>('pending')
    const [saving, setSaving] = useState(false)

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setSearchDebounce(search), 400)
        return () => clearTimeout(timer)
    }, [search])

    // Reset page on filter change
    useEffect(() => { setPage(1) }, [activeTab, searchDebounce])

    // Fetch orders
    const fetchOrders = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page: String(page), limit: '20' })
            if (activeTab !== 'all') params.set('status', activeTab)
            if (searchDebounce) params.set('q', searchDebounce)

            const res = await fetch(`/api/orders?${params}`)
            const json = await res.json()
            if (json.success) {
                setOrders(json.data)
                setPagination(json.pagination)
            }
        } catch (err) {
            console.error('Failed to fetch orders:', err)
        } finally {
            setLoading(false)
        }
    }, [page, activeTab, searchDebounce])

    useEffect(() => { fetchOrders() }, [fetchOrders])

    // Fetch status counts for tabs
    useEffect(() => {
        async function fetchCounts() {
            try {
                const res = await fetch('/api/orders?limit=1')
                const json = await res.json()
                const allTotal = json.pagination?.total || 0

                const statuses = ['pending', 'confirmed', 'packing', 'shipped', 'delivered', 'cancelled', 'refunded']
                const counts: Record<string, number> = { all: allTotal }

                await Promise.all(
                    statuses.map(async (status) => {
                        const r = await fetch(`/api/orders?status=${status}&limit=1`)
                        const j = await r.json()
                        counts[status] = j.pagination?.total || 0
                    })
                )
                setStatusCounts(counts)
            } catch (err) {
                console.error('Failed to fetch counts:', err)
            }
        }
        fetchCounts()
    }, [orders])

    // Update order status
    const handleUpdateStatus = async () => {
        if (!drawerOrder) return
        setSaving(true)
        try {
            const res = await fetch(`/api/orders/${drawerOrder._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: drawerStatus }),
            })
            const json = await res.json()
            if (json.success) {
                setDrawerOrder(null)
                fetchOrders()
            } else {
                alert(json.error || 'Cập nhật thất bại')
            }
        } catch {
            alert('Lỗi kết nối')
        } finally {
            setSaving(false)
        }
    }

    // Bulk confirm
    const handleBulkConfirm = async () => {
        if (selectedOrders.length === 0) return
        setSaving(true)
        try {
            await Promise.all(
                selectedOrders.map((id) =>
                    fetch(`/api/orders/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'confirmed' }),
                    })
                )
            )
            setSelectedOrders([])
            fetchOrders()
        } catch {
            alert('Lỗi kết nối')
        } finally {
            setSaving(false)
        }
    }

    const toggleSelect = (id: string) => {
        setSelectedOrders((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        )
    }

    const toggleAll = () => {
        if (selectedOrders.length === orders.length) {
            setSelectedOrders([])
        } else {
            setSelectedOrders(orders.map((o) => o._id))
        }
    }

    const openDrawer = (order: Order) => {
        setDrawerOrder(order)
        setDrawerStatus(order.status)
    }

    const statusTabs = [
        { key: 'all', label: 'Tất cả' },
        { key: 'pending', label: 'Chờ xác nhận' },
        { key: 'confirmed', label: 'Đã xác nhận' },
        { key: 'packing', label: 'Đang đóng gói' },
        { key: 'shipped', label: 'Đang giao' },
        { key: 'delivered', label: 'Đã giao' },
        { key: 'cancelled', label: 'Đã hủy' },
    ]

    return (
        <>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Quản lý đơn hàng</h1>
                </div>
                <div className={styles.headerRight}>
                    <button className={`${styles.actionBtn} ${styles.primary}`}>
                        XUẤT EXCEL
                    </button>
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div className={styles.filterTabs}>
                {statusTabs.map((tab) => (
                    <button
                        key={tab.key}
                        className={`${styles.filterTab} ${activeTab === tab.key ? styles.active : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                        <span className={styles.tabCount}>{statusCounts[tab.key] ?? 0}</span>
                    </button>
                ))}
            </div>

            {/* Search & Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.searchBox}>
                    <span className={styles.searchIcon}>🔍</span>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Tìm mã đơn, tên khách hàng..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                {selectedOrders.length > 0 && (
                    <div className={styles.bulkActions}>
                        <span className={styles.bulkLabel}>
                            {selectedOrders.length} đã chọn
                        </span>
                        <button
                            className={`${styles.actionBtn} ${styles.primary}`}
                            onClick={handleBulkConfirm}
                            disabled={saving}
                        >
                            ✓ XÁC NHẬN
                        </button>
                    </div>
                )}
            </div>

            {/* Orders Table */}
            <div className={styles.tableWrapper}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>
                        Đang tải...
                    </div>
                ) : orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>
                        Không có đơn hàng nào
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        className={styles.checkbox}
                                        checked={selectedOrders.length === orders.length && orders.length > 0}
                                        onChange={toggleAll}
                                    />
                                </th>
                                <th>Mã đơn</th>
                                <th>Khách hàng</th>
                                <th>Sản phẩm</th>
                                <th>Tổng tiền</th>
                                <th>Ngày đặt</th>
                                <th>Trạng thái</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => {
                                const custName = order.customerInfo?.name || order.user?.name || 'N/A'
                                const custEmail = order.customerInfo?.email || order.user?.email || ''
                                const itemNames = order.items.map((it) =>
                                    typeof it.product === 'object' ? it.product.name : 'Sản phẩm'
                                ).join(', ')

                                return (
                                    <tr key={order._id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                className={styles.checkbox}
                                                checked={selectedOrders.includes(order._id)}
                                                onChange={() => toggleSelect(order._id)}
                                            />
                                        </td>
                                        <td>
                                            <span className={styles.orderId} onClick={() => openDrawer(order)}>
                                                {order.orderCode}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.customer}>
                                                <span className={styles.customerName}>{custName}</span>
                                                <span className={styles.customerEmail}>{custEmail}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={styles.items}>
                                                {itemNames} {order.items.length > 1 && `(${order.items.length})`}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={styles.amount}>{formatVND(order.total)}</span>
                                        </td>
                                        <td>
                                            <span className={styles.date}>{formatDate(order.createdAt)}</span>
                                        </td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[order.status]}`}>
                                                {STATUS_LABELS[order.status] || order.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.rowActions}>
                                                <button
                                                    className={styles.rowActionBtn}
                                                    title="Xem chi tiết"
                                                    onClick={() => openDrawer(order)}
                                                >
                                                    👁️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                <div className={styles.pagination}>
                    <span className={styles.pageInfo}>
                        Hiển thị {orders.length} / {pagination.total} đơn hàng
                    </span>
                    <div className={styles.pageButtons}>
                        <button
                            className={styles.pageBtn}
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            ←
                        </button>
                        {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                            const pageNum = i + 1
                            return (
                                <button
                                    key={pageNum}
                                    className={`${styles.pageBtn} ${page === pageNum ? styles.active : ''}`}
                                    onClick={() => setPage(pageNum)}
                                >
                                    {pageNum}
                                </button>
                            )
                        })}
                        <button
                            className={styles.pageBtn}
                            disabled={page >= pagination.totalPages}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            →
                        </button>
                    </div>
                </div>
            </div>

            {/* Detail Drawer */}
            {drawerOrder && (
                <>
                    <div className={styles.drawerOverlay} onClick={() => setDrawerOrder(null)} />
                    <aside className={styles.drawer}>
                        <div className={styles.drawerHeader}>
                            <span className={styles.drawerTitle}>
                                Chi tiết đơn {drawerOrder.orderCode}
                            </span>
                            <button className={styles.drawerClose} onClick={() => setDrawerOrder(null)}>
                                ✕
                            </button>
                        </div>
                        <div className={styles.drawerBody}>
                            {/* Customer Info */}
                            <div className={styles.drawerSection}>
                                <div className={styles.drawerSectionTitle}>Thông tin khách hàng</div>
                                <div className={styles.drawerRow}>
                                    <span className={styles.drawerLabel}>Tên</span>
                                    <span className={styles.drawerValue}>
                                        {drawerOrder.customerInfo?.name || drawerOrder.user?.name || 'N/A'}
                                    </span>
                                </div>
                                <div className={styles.drawerRow}>
                                    <span className={styles.drawerLabel}>Email</span>
                                    <span className={styles.drawerValue}>
                                        {drawerOrder.customerInfo?.email || drawerOrder.user?.email || 'N/A'}
                                    </span>
                                </div>
                                <div className={styles.drawerRow}>
                                    <span className={styles.drawerLabel}>SĐT</span>
                                    <span className={styles.drawerValue}>
                                        {drawerOrder.customerInfo?.phone || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            {/* Order Info */}
                            <div className={styles.drawerSection}>
                                <div className={styles.drawerSectionTitle}>Thông tin đơn hàng</div>
                                <div className={styles.drawerRow}>
                                    <span className={styles.drawerLabel}>Mã đơn</span>
                                    <span className={styles.drawerValue}>{drawerOrder.orderCode}</span>
                                </div>
                                <div className={styles.drawerRow}>
                                    <span className={styles.drawerLabel}>Kênh</span>
                                    <span className={styles.drawerValue}>{drawerOrder.channel || 'online'}</span>
                                </div>
                                <div className={styles.drawerRow}>
                                    <span className={styles.drawerLabel}>Ngày đặt</span>
                                    <span className={styles.drawerValue}>{formatDate(drawerOrder.createdAt)}</span>
                                </div>
                                <div className={styles.drawerRow}>
                                    <span className={styles.drawerLabel}>Sản phẩm</span>
                                    <span className={styles.drawerValue}>
                                        {drawerOrder.items.map((it) =>
                                            `${typeof it.product === 'object' ? it.product.name : 'SP'} x${it.qty}`
                                        ).join(', ')}
                                    </span>
                                </div>
                                <div className={styles.drawerRow}>
                                    <span className={styles.drawerLabel}>Tạm tính</span>
                                    <span className={styles.drawerValue}>{formatVND(drawerOrder.subtotal)}</span>
                                </div>
                                {drawerOrder.discount > 0 && (
                                    <div className={styles.drawerRow}>
                                        <span className={styles.drawerLabel}>Giảm giá</span>
                                        <span className={styles.drawerValue}>-{formatVND(drawerOrder.discount)}</span>
                                    </div>
                                )}
                                {drawerOrder.shippingFee > 0 && (
                                    <div className={styles.drawerRow}>
                                        <span className={styles.drawerLabel}>Phí ship</span>
                                        <span className={styles.drawerValue}>{formatVND(drawerOrder.shippingFee)}</span>
                                    </div>
                                )}
                                <div className={styles.drawerRow}>
                                    <span className={styles.drawerLabel}>Tổng tiền</span>
                                    <span className={styles.drawerValue} style={{ fontWeight: 700, color: '#00C4AD' }}>
                                        {formatVND(drawerOrder.total)}
                                    </span>
                                </div>
                                <div className={styles.drawerRow}>
                                    <span className={styles.drawerLabel}>Trạng thái</span>
                                    <span className={`${styles.statusBadge} ${styles[drawerOrder.status]}`}>
                                        {STATUS_LABELS[drawerOrder.status] || drawerOrder.status}
                                    </span>
                                </div>
                                <div className={styles.drawerRow}>
                                    <span className={styles.drawerLabel}>Thanh toán</span>
                                    <span className={styles.drawerValue}>
                                        {drawerOrder.payment?.method || 'N/A'} — {drawerOrder.payment?.status || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            {/* Timeline */}
                            {drawerOrder.timeline && drawerOrder.timeline.length > 0 && (
                                <div className={styles.drawerSection}>
                                    <div className={styles.drawerSectionTitle}>Lịch sử</div>
                                    {drawerOrder.timeline.map((t, i) => (
                                        <div key={i} className={styles.drawerRow}>
                                            <span className={styles.drawerLabel}>
                                                {STATUS_LABELS[t.status] || t.status}
                                            </span>
                                            <span className={styles.drawerValue}>
                                                {formatDate(t.updatedAt)} {t.note && `— ${t.note}`}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Update Status */}
                            <div className={styles.drawerSection}>
                                <div className={styles.drawerSectionTitle}>Cập nhật trạng thái</div>
                                <div className={styles.statusDropdown}>
                                    <select
                                        className={styles.statusSelect}
                                        value={drawerStatus}
                                        onChange={(e) => setDrawerStatus(e.target.value as OrderStatus)}
                                    >
                                        {STATUS_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className={styles.drawerFooter}>
                            <button
                                className={`${styles.actionBtn} ${styles.primary}`}
                                onClick={handleUpdateStatus}
                                disabled={saving || drawerStatus === drawerOrder.status}
                            >
                                {saving ? 'Đang lưu...' : '💾 LƯU THAY ĐỔI'}
                            </button>
                        </div>
                    </aside>
                </>
            )}
        </>
    )
}
