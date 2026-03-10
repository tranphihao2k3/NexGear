// ============================================================
// NEXGEAR — Admin Customers Page (A07)
// ============================================================
'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import styles from './page.module.scss'
import { CyberpunkLoader } from '@/components/ui'
import { downloadCsv, toCsv } from '@/lib/csv'

interface Customer {
    _id: string
    name: string
    email: string
    image?: string
    addresses: { phone?: string }[]
    totalSpent: number
    loyaltyPoints: number
    createdAt: string
}

const COLORS = ['#00C4AD', '#F0356A', '#7B3FF2', '#F0A500', '#1DB96A']

function formatVND(amount: number) {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`
    return `${amount}đ`
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('vi-VN')
}

function getColor(index: number) {
    return COLORS[index % COLORS.length]
}

export default function AdminCustomersPage() {
    const [search, setSearch] = useState('')
    const [searchDebounce, setSearchDebounce] = useState('')
    const [selected, setSelected] = useState<Customer | null>(null)

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setSearchDebounce(search), 400)
        return () => clearTimeout(timer)
    }, [search])

    // ── React Query — auto-cache per search term ──
    const sp = new URLSearchParams({ role: 'customer', limit: '50' })
    if (searchDebounce) sp.set('q', searchDebounce)
    const { data: result, isPending: loading } = useQuery({
        queryKey: ['users', 'list', { role: 'customer', q: searchDebounce }],
        queryFn: () => fetch(`/api/users?${sp}`).then(r => r.json()).then(d => ({
            customers: d.data ?? [],
            total: d.pagination?.total ?? d.data?.length ?? 0,
        })),
        staleTime: 1000 * 60 * 2,
        placeholderData: (prev) => prev,
    })
    const customers = result?.customers ?? []
    const total = result?.total ?? 0

    const handleExportCustomers = () => {
        if (customers.length === 0) {
            alert('Không có khách hàng để xuất')
            return
        }

        const csv = toCsv(
            customers.map((customer: any) => ({
                ten_khach_hang: customer.name,
                email: customer.email,
                dien_thoai: customer.addresses?.[0]?.phone || '',
                tong_chi_tieu: customer.totalSpent || 0,
                diem_tich_luy: customer.loyaltyPoints || 0,
                ngay_tham_gia: formatDate(customer.createdAt),
            }))
        )

        downloadCsv(`customers-${new Date().toISOString().slice(0, 10)}.csv`, csv)
    }

    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Khách hàng</h1>
                    <div className={styles.subtitle}>{total} khách hàng</div>
                </div>
                <button className={styles.exportBtn} onClick={handleExportCustomers}>📥 XUẤT DANH SÁCH</button>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchBox}>
                    <span className={styles.searchIcon}>🔍</span>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Tìm tên, email khách hàng..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className={styles.contentLayout}>
                {/* Customer Table */}
                <div className={styles.tableWrapper}>
                    {loading ? (
                        <CyberpunkLoader message="Đang tải khách hàng..." compact />
                    ) : customers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>
                            Không có khách hàng nào
                        </div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Khách hàng</th>
                                    <th>Tổng chi tiêu</th>
                                    <th>Điểm</th>
                                    <th>Ngày tham gia</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map((customer: Customer, idx: number) => (
                                    <tr
                                        key={customer._id}
                                        className={selected?._id === customer._id ? styles.selected : ''}
                                        onClick={() => setSelected(customer)}
                                    >
                                        <td>
                                            <div className={styles.customerCell}>
                                                <div className={styles.avatar} style={{ background: getColor(idx) }}>
                                                    {customer.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className={styles.customerName}>{customer.name}</div>
                                                    <div className={styles.customerEmail}>{customer.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={styles.totalSpent}>
                                                {formatVND(customer.totalSpent || 0)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={styles.orderCount}>
                                                {customer.loyaltyPoints || 0}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={styles.customerEmail}>
                                                {formatDate(customer.createdAt)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Profile Sidebar */}
                <div className={styles.profileSidebar}>
                    {selected ? (
                        <>
                            <div className={styles.profileHeader}>
                                <div className={styles.profileAvatar} style={{ background: getColor(customers.indexOf(selected)) }}>
                                    {selected.name.charAt(0)}
                                </div>
                                <div className={styles.profileName}>{selected.name}</div>
                                <div className={styles.profileEmail}>{selected.email}</div>
                            </div>
                            <div className={styles.profileStats}>
                                <div className={styles.profileStat}>
                                    <div className={styles.statValue}>{selected.loyaltyPoints || 0}</div>
                                    <div className={styles.statLabel}>Điểm tích lũy</div>
                                </div>
                                <div className={styles.profileStat}>
                                    <div className={styles.statValue}>{formatVND(selected.totalSpent || 0)}</div>
                                    <div className={styles.statLabel}>Chi tiêu</div>
                                </div>
                            </div>
                            <div className={styles.profileDetails}>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Điện thoại</span>
                                    <span className={styles.detailValue}>
                                        {selected.addresses?.[0]?.phone || 'Chưa có'}
                                    </span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Tham gia</span>
                                    <span className={styles.detailValue}>
                                        {formatDate(selected.createdAt)}
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className={styles.emptyProfile}>
                            <span className={styles.emptyIcon}>👤</span>
                            <span className={styles.emptyText}>Chọn khách hàng để xem chi tiết</span>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
