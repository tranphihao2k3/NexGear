// ============================================================
// NEXGEAR — Super Admin: Shops Management Page
// Route: /admin/shops
// Chỉ dành cho role: superadmin
// ============================================================
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useToast, CyberpunkLoader } from '@/components/ui'
import styles from './page.module.scss'

interface Shop {
    _id: string
    siteId: string
    storeName: string
    storeEmail: string
    storePhone: string
    siteDomain: string
    ownerEmail: string
    isActive: boolean
    plan: string
    primaryColor: string
    createdAt: string
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
    free: { label: 'Free', color: '#7A7870' },
    pro: { label: 'Pro', color: '#00C4AD' },
    enterprise: { label: 'Enterprise', color: '#7B3FF2' },
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function AdminShopsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const { success, error, info } = useToast()

    const [shops, setShops] = useState<Shop[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)

    // Form state
    const [formSiteId, setFormSiteId] = useState('')
    const [formName, setFormName] = useState('')
    const [formDomain, setFormDomain] = useState('')
    const [formPhone, setFormPhone] = useState('')
    const [formEmail, setFormEmail] = useState('')
    const [formAddress, setFormAddress] = useState('')
    const [formColor, setFormColor] = useState('#00C4AD')
    const [formPlan, setFormPlan] = useState('free')
    const [formAdminName, setFormAdminName] = useState('')
    const [formAdminEmail, setFormAdminEmail] = useState('')
    const [formAdminPassword, setFormAdminPassword] = useState('')

    const user = (session?.user as any)

    // Guard: chỉ superadmin
    useEffect(() => {
        if (status === 'loading') return
        if (!session || user?.role !== 'superadmin') {
            info('Bạn không có quyền truy cập trang này')
            router.push('/admin')
        }
    }, [session, status])

    const fetchShops = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/shops')
            const json = await res.json()
            if (json.success) setShops(json.data)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchShops() }, [fetchShops])

    const resetForm = () => {
        setFormSiteId('')
        setFormName('')
        setFormDomain('')
        setFormPhone('')
        setFormEmail('')
        setFormAddress('')
        setFormColor('#00C4AD')
        setFormPlan('free')
        setFormAdminName('')
        setFormAdminEmail('')
        setFormAdminPassword('')
    }

    const handleCreate = async () => {
        if (!formSiteId || !formName || !formAdminEmail || !formAdminPassword) {
            return error('Vui lòng điền đầy đủ: Site ID, Tên shop, Email admin, Mật khẩu admin')
        }
        if (formAdminPassword.length < 6) {
            return error('Mật khẩu phải có ít nhất 6 ký tự')
        }

        setSaving(true)
        try {
            const res = await fetch('/api/shops', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    siteId: formSiteId.toLowerCase().replace(/\s+/g, '-'),
                    storeName: formName,
                    siteDomain: formDomain,
                    storePhone: formPhone,
                    storeEmail: formEmail,
                    storeAddress: formAddress,
                    primaryColor: formColor,
                    plan: formPlan,
                    adminName: formAdminName || `Admin ${formName}`,
                    adminEmail: formAdminEmail,
                    adminPassword: formAdminPassword,
                }),
            })
            const json = await res.json()
            if (!json.success) throw new Error(json.error || 'Tạo shop thất bại')

            success(`✅ Đã tạo shop "${formName}" thành công!`)
            setShowModal(false)
            resetForm()
            fetchShops()
        } catch (e: any) {
            error(e.message)
        } finally {
            setSaving(false)
        }
    }

    if (status === 'loading' || loading) {
        return <CyberpunkLoader message="Đang tải danh sách shops..." />
    }

    return (
        <>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.superBadge}>👑 SUPERADMIN</div>
                    <h1>Quản lý Shops</h1>
                    <p className={styles.headerDesc}>Tạo và quản lý tất cả các cửa hàng trên nền tảng NEXGEAR</p>
                </div>
                <button className={styles.addBtn} onClick={() => { resetForm(); setShowModal(true) }}>
                    + TẠO SHOP MỚI
                </button>
            </div>

            {/* Stats bar */}
            <div className={styles.statsBar}>
                <div className={styles.statCard}>
                    <span className={styles.statNum}>{shops.length}</span>
                    <span className={styles.statLabel}>Tổng Shops</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statNum} style={{ color: '#1DB96A' }}>{shops.filter(s => s.isActive).length}</span>
                    <span className={styles.statLabel}>Đang hoạt động</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statNum} style={{ color: '#00C4AD' }}>{shops.filter(s => s.plan === 'pro').length}</span>
                    <span className={styles.statLabel}>Gói Pro</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statNum} style={{ color: '#7B3FF2' }}>{shops.filter(s => s.plan === 'enterprise').length}</span>
                    <span className={styles.statLabel}>Enterprise</span>
                </div>
            </div>

            {/* Shops grid */}
            {shops.length === 0 ? (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>🏪</div>
                    <p>Chưa có shop nào. Hãy tạo shop đầu tiên!</p>
                </div>
            ) : (
                <div className={styles.shopsGrid}>
                    {shops.map((shop) => {
                        const plan = PLAN_LABELS[shop.plan] || PLAN_LABELS.free
                        return (
                            <div key={shop._id} className={styles.shopCard}>
                                {/* Color stripe */}
                                <div className={styles.shopStripe} style={{ background: shop.primaryColor || '#00C4AD' }} />

                                <div className={styles.shopBody}>
                                    <div className={styles.shopTitleRow}>
                                        <h3 className={styles.shopName}>{shop.storeName}</h3>
                                        <div className={styles.shopBadges}>
                                            <span className={styles.planBadge} style={{ color: plan.color, borderColor: plan.color }}>
                                                {plan.label}
                                            </span>
                                            <span className={`${styles.statusDot} ${shop.isActive ? styles.active : styles.inactive}`} />
                                        </div>
                                    </div>

                                    <code className={styles.siteId}>#{shop.siteId}</code>

                                    <div className={styles.shopInfo}>
                                        {shop.siteDomain && (
                                            <div className={styles.infoRow}>
                                                <span className={styles.infoIcon}>🌐</span>
                                                <a href={`https://${shop.siteDomain.replace(/^https?:\/\//, '')}`}
                                                    target="_blank" rel="noopener noreferrer"
                                                    className={styles.infoLink}>
                                                    {shop.siteDomain.replace(/^https?:\/\//, '')}
                                                </a>
                                            </div>
                                        )}
                                        {shop.ownerEmail && (
                                            <div className={styles.infoRow}>
                                                <span className={styles.infoIcon}>👤</span>
                                                <span className={styles.infoText}>{shop.ownerEmail}</span>
                                            </div>
                                        )}
                                        {shop.storePhone && (
                                            <div className={styles.infoRow}>
                                                <span className={styles.infoIcon}>📞</span>
                                                <span className={styles.infoText}>{shop.storePhone}</span>
                                            </div>
                                        )}
                                        <div className={styles.infoRow}>
                                            <span className={styles.infoIcon}>📅</span>
                                            <span className={styles.infoText}>{formatDate(shop.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Create Shop Modal */}
            {showModal && (
                <div className={styles.overlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <span className={styles.modalTitle}>🏪 Tạo Shop Mới</span>
                            <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* Shop Info */}
                            <div className={styles.section}>
                                <div className={styles.sectionTitle}>📋 Thông tin cửa hàng</div>
                                <div className={styles.formGrid}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Site ID <span className={styles.required}>*</span></label>
                                        <input className={styles.input} value={formSiteId}
                                            onChange={e => setFormSiteId(e.target.value)}
                                            placeholder="vd: thanh-vo-laptop (viết thường, không dấu, dùng gạch ngang)" />
                                        <span className={styles.hint}>Dùng để phân biệt shop trong hệ thống. Không thể thay đổi sau khi tạo.</span>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Tên cửa hàng <span className={styles.required}>*</span></label>
                                        <input className={styles.input} value={formName}
                                            onChange={e => setFormName(e.target.value)}
                                            placeholder="vd: Thành Võ Laptop" />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Tên miền (domain)</label>
                                        <input className={styles.input} value={formDomain}
                                            onChange={e => setFormDomain(e.target.value)}
                                            placeholder="vd: laptopthanhhvo.com" />
                                        <span className={styles.hint}>Không cần https://. Dùng để routing multi-tenant.</span>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>SĐT cửa hàng</label>
                                        <input className={styles.input} value={formPhone}
                                            onChange={e => setFormPhone(e.target.value)}
                                            placeholder="0901234567" />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Email cửa hàng</label>
                                        <input className={styles.input} type="email" value={formEmail}
                                            onChange={e => setFormEmail(e.target.value)}
                                            placeholder="contact@shop.com" />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Địa chỉ</label>
                                        <input className={styles.input} value={formAddress}
                                            onChange={e => setFormAddress(e.target.value)}
                                            placeholder="123 Đường ABC, Quận 1..." />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Màu chủ đạo</label>
                                        <div className={styles.colorRow}>
                                            <input type="color" className={styles.colorPicker}
                                                value={formColor} onChange={e => setFormColor(e.target.value)} />
                                            <input className={styles.input} value={formColor}
                                                onChange={e => setFormColor(e.target.value)}
                                                placeholder="#00C4AD" />
                                        </div>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Gói dịch vụ</label>
                                        <select className={styles.input} value={formPlan}
                                            onChange={e => setFormPlan(e.target.value)}>
                                            <option value="free">Free</option>
                                            <option value="pro">Pro</option>
                                            <option value="enterprise">Enterprise</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Admin Account */}
                            <div className={styles.section}>
                                <div className={styles.sectionTitle}>👤 Tài khoản Admin của shop</div>
                                <div className={styles.formGrid}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Tên admin</label>
                                        <input className={styles.input} value={formAdminName}
                                            onChange={e => setFormAdminName(e.target.value)}
                                            placeholder={`Admin ${formName || 'Shop'}`} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Email admin <span className={styles.required}>*</span></label>
                                        <input className={styles.input} type="email" value={formAdminEmail}
                                            onChange={e => setFormAdminEmail(e.target.value)}
                                            placeholder="admin@shop.com" />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Mật khẩu tạm <span className={styles.required}>*</span></label>
                                        <input className={styles.input} type="password" value={formAdminPassword}
                                            onChange={e => setFormAdminPassword(e.target.value)}
                                            placeholder="Tối thiểu 6 ký tự" />
                                        <span className={styles.hint}>Giao cho admin của shop và yêu cầu họ đổi mật khẩu ngay.</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setShowModal(false)} disabled={saving}>HỦY</button>
                            <button className={styles.createBtn} onClick={handleCreate} disabled={saving}>
                                {saving ? '⏳ Đang tạo...' : '🏪 TẠO SHOP'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
