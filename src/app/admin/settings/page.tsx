// ============================================================
// NEXGEAR — Admin Settings Page — All tabs connected to API
// ============================================================
'use client'

import { useState, useEffect } from 'react'
import styles from './page.module.scss'
import { CyberpunkLoader, useToast } from '@/components/ui'

type SettingsTab = 'general' | 'notifications' | 'appearance' | 'shipping' | 'navigation'

interface UploadState {
    loading: boolean;
    error: string;
}

interface SettingsData {
    // Appearance
    primaryColor: string
    accentColor: string
    logoUrl: string
    faviconUrl: string
    bannerText: string
    showLandingPage: boolean
    // General
    storeName: string
    storeEmail: string
    storePhone: string
    storeAddress: string
    taxCode: string
    currency: string
    // SEO & Site Identity
    siteTitle: string
    siteTitleTemplate: string
    siteDescription: string
    siteTagline: string
    siteDomain: string
    siteKeywords: string
    ogImage: string
    // Social
    facebook: string
    instagram: string
    tiktok: string
    facebookPageId: string
    googleMapsEmbedUrl: string
    // Danger
    maintenanceMode: boolean
    // Notifications
    emailOrderNotif: boolean
    emailDailyReport: boolean
    stockAlertNotif: boolean
    smsNotif: boolean
    // Shipping
    shippingInner: number
    shippingOuter: number
    shippingSouth: number
    shippingNorth: number
    freeShipMinOrder: number
    ghtkToken: string
    ghnToken: string
    // Bank & Payment
    bankAccountName: string
    bankAccountNumber: string
    bankName: string
    // Bộ Công Thương
    bctLink: string
    bctType: 'notified' | 'registered'
    // Drag-and-drop customizable header menu
    headerMenu: {
        id: string;
        label: string;
        href: string;
        isMegaMenu: boolean;
        highlight: boolean;
        children?: { id: string; label: string; href: string; desc?: string }[];
    }[];
}

const DEFAULTS: SettingsData = {
    primaryColor: '#00C4AD',
    accentColor: '#F0356A',
    logoUrl: '',
    faviconUrl: '',
    bannerText: '',
    showLandingPage: true,
    storeName: 'NEXGEAR',
    storeEmail: 'contact@nexgzone.top',
    storePhone: '0901 234 567',
    storeAddress: '123 Nguyễn Huệ, Quận 1, TP.HCM',
    taxCode: '',
    currency: 'VND',
    siteTitle: 'NexGear — Gear Máy Tính Chính Hãng Cần Thơ',
    siteTitleTemplate: '%s | NexGear',
    siteDescription: 'NexGear — shop gear máy tính chính hãng #1 Cần Thơ. Bàn phím cơ, chuột gaming, tai nghe, loa, micro và phụ kiện. Giao nhanh 2H, bảo hành 12T.',
    siteTagline: 'NEXT-GEN GEAR STORE',
    siteDomain: 'https://nexgzone.top',
    siteKeywords: 'gear máy tính Cần Thơ, bàn phím cơ, chuột gaming, tai nghe gaming, phụ kiện PC, nexgear, shop gear Cần Thơ',
    ogImage: '/og-image.jpg',
    facebook: '',
    instagram: '',
    tiktok: '',
    facebookPageId: '',
    googleMapsEmbedUrl: '',
    maintenanceMode: false,
    emailOrderNotif: true,
    emailDailyReport: true,
    stockAlertNotif: true,
    smsNotif: false,
    shippingInner: 20000,
    shippingOuter: 30000,
    shippingSouth: 35000,
    shippingNorth: 45000,
    freeShipMinOrder: 500000,
    ghtkToken: '',
    ghnToken: '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankName: '',
    bctLink: '',
    bctType: 'notified',
    headerMenu: [
        { id: '1', label: 'Trang chủ', href: '/', isMegaMenu: false, highlight: false },
        { id: '2', label: 'Laptop', href: '/laptop', isMegaMenu: true, highlight: false },
        { id: '3', label: 'Dịch vụ', href: '/sua-chua-laptop', isMegaMenu: false, highlight: false, children: [
            { id: '3-1', label: 'Sửa chữa Laptop', href: '/sua-chua-laptop', desc: 'Chẩn đoán, sửa chữa chuyên nghiệp' },
            { id: '3-2', label: 'Thu cũ đổi mới', href: '/thu-cu-doi-moi', desc: 'Lên đời laptop, trợ giá tốt' }
        ]},
        { id: '4', label: 'Blog', href: '/blog', isMegaMenu: false, highlight: false },
        { id: '5', label: 'Flash Deal', href: '/deals', isMegaMenu: false, highlight: true },
        { id: '6', label: '🧪 Test Laptop', href: '/test-laptop', isMegaMenu: false, highlight: false }
    ]
}

export default function AdminSettingsPage() {
    const { success, error } = useToast()
    const [activeTab, setActiveTab] = useState<SettingsTab>('general')
    const [settings, setSettings] = useState<SettingsData>(DEFAULTS)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploadLogo, setUploadLogo] = useState<UploadState>({ loading: false, error: '' })
    const [uploadFavicon, setUploadFavicon] = useState<UploadState>({ loading: false, error: '' })

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings')
                const result = await res.json()
                if (result.success && result.data) {
                    setSettings({ ...DEFAULTS, ...result.data })
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchSettings()
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setSettings((prev) => ({ ...prev, [name]: value }))
    }

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setSettings((prev) => ({ ...prev, [name]: Number(value) || 0 }))
    }

    const handleToggle = (field: keyof SettingsData) => {
        setSettings((prev) => ({ ...prev, [field]: !(prev[field] as boolean) }))
    }

    const saveSettings = async (fields: Partial<SettingsData>) => {
        setSaving(true)
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fields),
            })
            const result = await res.json()
            if (result.success) {
                success('Đã lưu cài đặt!')
                // Update CSS variables if appearance changed
                if (fields.primaryColor) {
                    document.documentElement.style.setProperty('--color-primary', fields.primaryColor)
                }
                if (fields.accentColor) {
                    document.documentElement.style.setProperty('--color-accent', fields.accentColor)
                }
            } else {
                error('Lưu cài đặt thất bại!')
            }
        } catch {
            error('Có lỗi xảy ra khi lưu!')
        } finally {
            setSaving(false)
        }
    }

    // ── Upload logo/favicon helpers ──────────────────────────────
    const handleImageUpload = async (
        file: File,
        field: 'logoUrl' | 'faviconUrl',
        setState: (s: UploadState) => void
    ) => {
        if (!file) return;
        setState({ loading: true, error: '' });
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('folder', 'logos');
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            const result = await res.json();
            if (result.success && result.data?.url) {
                setSettings(prev => ({ ...prev, [field]: result.data.url }));
                setState({ loading: false, error: '' });
            } else {
                setState({ loading: false, error: result.error || 'Upload thất bại' });
            }
        } catch {
            setState({ loading: false, error: 'Lỗi kết nối' });
        }
    }

    const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleImageUpload(file, 'logoUrl', setUploadLogo);
        e.target.value = '';
    }

    const handleFaviconFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleImageUpload(file, 'faviconUrl', setUploadFavicon);
        e.target.value = '';
    }

    const saveGeneral = () => saveSettings({
        storeName: settings.storeName,
        storeEmail: settings.storeEmail,
        storePhone: settings.storePhone,
        storeAddress: settings.storeAddress,
        taxCode: settings.taxCode,
        currency: settings.currency,
        bankAccountName: settings.bankAccountName,
        bankAccountNumber: settings.bankAccountNumber,
        bankName: settings.bankName,
        bctLink: settings.bctLink,
        bctType: settings.bctType,
    })

    const saveSeo = () => saveSettings({
        siteTitle: settings.siteTitle,
        siteTitleTemplate: settings.siteTitleTemplate,
        siteDescription: settings.siteDescription,
        siteTagline: settings.siteTagline,
        siteDomain: settings.siteDomain,
        siteKeywords: settings.siteKeywords,
        ogImage: settings.ogImage,
    })

    const saveSocial = () => saveSettings({
        facebook: settings.facebook,
        instagram: settings.instagram,
        tiktok: settings.tiktok,
        facebookPageId: settings.facebookPageId,
        googleMapsEmbedUrl: settings.googleMapsEmbedUrl,
    })

    const saveNotifications = () => saveSettings({
        emailOrderNotif: settings.emailOrderNotif,
        emailDailyReport: settings.emailDailyReport,
        stockAlertNotif: settings.stockAlertNotif,
        smsNotif: settings.smsNotif,
    })

    const saveShipping = () => saveSettings({
        shippingInner: settings.shippingInner,
        shippingOuter: settings.shippingOuter,
        shippingSouth: settings.shippingSouth,
        shippingNorth: settings.shippingNorth,
        freeShipMinOrder: settings.freeShipMinOrder,
    })

    const saveShippingApi = () => saveSettings({
        ghtkToken: settings.ghtkToken,
        ghnToken: settings.ghnToken,
    })

    const saveAppearance = () => saveSettings({
        primaryColor: settings.primaryColor,
        accentColor: settings.accentColor,
        logoUrl: settings.logoUrl,
        faviconUrl: settings.faviconUrl,
        bannerText: settings.bannerText,
        showLandingPage: settings.showLandingPage,
    })

    const toggleMaintenance = async () => {
        const newVal = !settings.maintenanceMode
        setSettings((prev) => ({ ...prev, maintenanceMode: newVal }))
        await saveSettings({ maintenanceMode: newVal })
    }

    const tabs: { key: SettingsTab; label: string }[] = [
        { key: 'general', label: 'Cửa hàng' },
        { key: 'notifications', label: 'Thông báo' },
        { key: 'shipping', label: 'Vận chuyển' },
        { key: 'appearance', label: 'Giao diện' },
        { key: 'navigation', label: 'Menu Header (Kéo thả)' },
    ]

    if (loading) {
        return <CyberpunkLoader message="Đang tải cài đặt..." />
    }

    return (
        <>
            <div className={styles.header}>
                <h1>Cài đặt</h1>
                <div className={styles.subtitle}>Quản lý cấu hình cửa hàng {settings.storeName}</div>
            </div>

            {/* Tab navigation */}
            <div className={styles.tabNav}>
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ─── GENERAL TAB ─── */}
            {activeTab === 'general' && (
                <>
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionTitle}>Thông tin cửa hàng</div>
                            <div className={styles.sectionDesc}>Thông tin cơ bản hiển thị trên website và hóa đơn</div>
                        </div>
                        <div className={styles.sectionBody}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Tên cửa hàng</label>
                                <input className={styles.formInput} name="storeName" value={settings.storeName} onChange={handleChange} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Email liên hệ</label>
                                <input className={styles.formInput} name="storeEmail" value={settings.storeEmail} onChange={handleChange} type="email" />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Số điện thoại</label>
                                <input className={styles.formInput} name="storePhone" value={settings.storePhone} onChange={handleChange} type="tel" />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Địa chỉ</label>
                                <textarea className={styles.formTextarea} name="storeAddress" value={settings.storeAddress} onChange={handleChange} />
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Mã số thuế</label>
                                    <input className={styles.formInput} name="taxCode" value={settings.taxCode} onChange={handleChange} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Đồng tiền</label>
                                    <select className={styles.formSelect} name="currency" value={settings.currency} onChange={handleChange}>
                                        <option value="VND">VNĐ (₫)</option>
                                        <option value="USD">USD ($)</option>
                                    </select>
                                </div>
                            </div>
                            {/* ── Bank info ── */}
                            <div className={styles.sectionTitle} style={{ marginTop: '1rem', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>🏦 Thông tin tài khoản ngân hàng</div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Tên chủ tài khoản</label>
                                <input className={styles.formInput} name="bankAccountName" value={settings.bankAccountName} onChange={handleChange} placeholder="VD: NGUYEN VAN A" />
                                <span className={styles.formHint}>Hiển thị trên trang Chính sách thanh toán — yêu cầu BCT</span>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Số tài khoản</label>
                                    <input className={styles.formInput} name="bankAccountNumber" value={settings.bankAccountNumber} onChange={handleChange} placeholder="VD: 1234567890" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Tên ngân hàng</label>
                                    <input className={styles.formInput} name="bankName" value={settings.bankName} onChange={handleChange} placeholder="VD: Vietcombank - CN HCM" />
                                </div>
                            </div>

                            {/* ── Bộ Công Thương ── */}
                            <div className={styles.sectionTitle} style={{ marginTop: '1.5rem', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>🏛️ Thông báo Bộ Công Thương</div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Link đăng ký (online.gov.vn)</label>
                                <input className={styles.formInput} name="bctLink" value={settings.bctLink} onChange={handleChange} placeholder="VD: http://online.gov.vn/Home/WebDetails/..." />
                                <span className={styles.formHint}>Link dẫn tới trang chi tiết đăng ký của website bạn trên cổng BCT</span>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Loại phù hiệu</label>
                                <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                                        <input 
                                            type="radio" 
                                            name="bctType" 
                                            value="notified" 
                                            checked={settings.bctType === 'notified'} 
                                            onChange={handleChange} 
                                        />
                                        <span>🔵 Đã thông báo (Xanh)</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                                        <input 
                                            type="radio" 
                                            name="bctType" 
                                            value="registered" 
                                            checked={settings.bctType === 'registered'} 
                                            onChange={handleChange} 
                                        />
                                        <span>🔴 Đã đăng ký (Đỏ)</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className={styles.sectionFooter}>
                            <button className={styles.saveBtn} onClick={saveGeneral} disabled={saving}>
                                {saving ? 'ĐANG LƯU...' : '💾 LƯU THAY ĐỔI'}
                            </button>
                        </div>
                    </div>

                    {/* SEO & Site Identity */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionTitle}>Thông tin website & SEO</div>
                            <div className={styles.sectionDesc}>Cấu hình tiêu đề, mô tả, domain và thông tin SEO</div>
                        </div>
                        <div className={styles.sectionBody}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Tiêu đề trang chủ</label>
                                <input className={styles.formInput} name="siteTitle" value={settings.siteTitle} onChange={handleChange} placeholder="NexGear — Gear Máy Tính Chính Hãng" />
                                <span className={styles.formHint}>Title hiển thị trên tab trình duyệt & Google</span>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Title Template (sub-pages)</label>
                                <input className={styles.formInput} name="siteTitleTemplate" value={settings.siteTitleTemplate} onChange={handleChange} placeholder="%s | NexGear" />
                                <span className={styles.formHint}>%s sẽ được thay bằng tên trang con. VD: &quot;Sản phẩm | NexGear&quot;</span>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Tagline</label>
                                <input className={styles.formInput} name="siteTagline" value={settings.siteTagline} onChange={handleChange} placeholder="NEXT-GEN GEAR STORE" />
                                <span className={styles.formHint}>Hiển thị dưới logo, hero section</span>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Mô tả SEO</label>
                                <textarea className={styles.formTextarea} name="siteDescription" value={settings.siteDescription} onChange={handleChange} rows={3} placeholder="Mô tả ngắn gọn về cửa hàng..." />
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Domain</label>
                                    <input className={styles.formInput} name="siteDomain" value={settings.siteDomain} onChange={handleChange} placeholder="https://nexgzone.top" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>OG Image URL</label>
                                    <input className={styles.formInput} name="ogImage" value={settings.ogImage} onChange={handleChange} placeholder="/og-image.jpg" />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Keywords SEO</label>
                                <textarea className={styles.formTextarea} name="siteKeywords" value={settings.siteKeywords} onChange={handleChange} rows={2} placeholder="gear máy tính, bàn phím cơ, chuột gaming..." />
                                <span className={styles.formHint}>Phân cách bằng dấu phẩy</span>
                            </div>
                        </div>
                        <div className={styles.sectionFooter}>
                            <button className={styles.saveBtn} onClick={saveSeo} disabled={saving}>
                                {saving ? 'ĐANG LƯU...' : '💾 LƯU SEO'}
                            </button>
                        </div>
                    </div>

                    {/* Social Links */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionTitle}>Mạng xã hội</div>
                        </div>
                        <div className={styles.sectionBody}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Facebook</label>
                                <input className={styles.formInput} name="facebook" value={settings.facebook} onChange={handleChange} placeholder="https://facebook.com/nexgear" />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Instagram</label>
                                <input className={styles.formInput} name="instagram" value={settings.instagram} onChange={handleChange} placeholder="https://instagram.com/nexgear" />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>TikTok</label>
                                <input className={styles.formInput} name="tiktok" value={settings.tiktok} onChange={handleChange} placeholder="https://tiktok.com/@nexgear" />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Facebook Page ID (Fanpage Embed)</label>
                                <input className={styles.formInput} name="facebookPageId" value={settings.facebookPageId} onChange={handleChange} placeholder="VD: laptopthanhhvo hoặc 123456789" />
                                <span className={styles.formHint}>ID hoặc tên trang Facebook để hiển thị widget footer. Lấy từ URL: facebook.com/<strong>page-id</strong></span>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>🗺 Google Maps Embed URL</label>
                                <textarea className={styles.formTextarea} name="googleMapsEmbedUrl" value={settings.googleMapsEmbedUrl} onChange={handleChange} rows={3} placeholder="https://www.google.com/maps/embed?pb=..." />
                                <span className={styles.formHint}>
                                    Vào Google Maps → Tìm địa chỉ → Chia sẻ → Nhúng bản đồ → sao chép URL trong thẻ <code>&lt;iframe src="..."&gt;</code>
                                </span>
                            </div>
                        </div>
                        <div className={styles.sectionFooter}>
                            <button className={styles.saveBtn} onClick={saveSocial} disabled={saving}>
                                {saving ? 'ĐANG LƯU...' : '💾 LƯU'}
                            </button>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className={`${styles.section} ${styles.dangerSection}`}>
                        <div className={`${styles.sectionHeader} ${styles.dangerHeader}`}>
                            <div className={styles.dangerTitle}>⚠ Khu vực nguy hiểm</div>
                        </div>
                        <div className={styles.sectionBody}>
                            <div className={styles.dangerItem}>
                                <div className={styles.dangerItemInfo}>
                                    <div className={styles.dangerItemLabel}>Chế độ bảo trì</div>
                                    <div className={styles.dangerItemDesc}>
                                        Tạm tắt website, chỉ admin mới truy cập được
                                    </div>
                                </div>
                                <div
                                    className={`${styles.toggleSwitch} ${settings.maintenanceMode ? styles.on : ''}`}
                                    onClick={toggleMaintenance}
                                >
                                    <div className={styles.toggleKnob} />
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ─── NOTIFICATIONS TAB ─── */}
            {activeTab === 'notifications' && (
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionTitle}>Cài đặt thông báo</div>
                        <div className={styles.sectionDesc}>Chọn loại thông báo bạn muốn nhận</div>
                    </div>
                    <div className={styles.sectionBody}>
                        <div className={styles.toggleRow}>
                            <div className={styles.toggleInfo}>
                                <div className={styles.toggleLabel}>Email thông báo đơn hàng mới</div>
                                <div className={styles.toggleDesc}>Nhận email mỗi khi có đơn hàng mới</div>
                            </div>
                            <div
                                className={`${styles.toggleSwitch} ${settings.emailOrderNotif ? styles.on : ''}`}
                                onClick={() => handleToggle('emailOrderNotif')}
                            >
                                <div className={styles.toggleKnob} />
                            </div>
                        </div>

                        <div className={styles.toggleRow}>
                            <div className={styles.toggleInfo}>
                                <div className={styles.toggleLabel}>Email báo cáo doanh thu hàng ngày</div>
                                <div className={styles.toggleDesc}>Tổng kết doanh thu gửi vào 23:00 mỗi ngày</div>
                            </div>
                            <div
                                className={`${styles.toggleSwitch} ${settings.emailDailyReport ? styles.on : ''}`}
                                onClick={() => handleToggle('emailDailyReport')}
                            >
                                <div className={styles.toggleKnob} />
                            </div>
                        </div>

                        <div className={styles.toggleRow}>
                            <div className={styles.toggleInfo}>
                                <div className={styles.toggleLabel}>Cảnh báo sắp hết hàng</div>
                                <div className={styles.toggleDesc}>Nhận thông báo khi sản phẩm còn ≤ 5 trong kho</div>
                            </div>
                            <div
                                className={`${styles.toggleSwitch} ${settings.stockAlertNotif ? styles.on : ''}`}
                                onClick={() => handleToggle('stockAlertNotif')}
                            >
                                <div className={styles.toggleKnob} />
                            </div>
                        </div>

                        <div className={styles.toggleRow}>
                            <div className={styles.toggleInfo}>
                                <div className={styles.toggleLabel}>SMS thông báo</div>
                                <div className={styles.toggleDesc}>Nhận tin nhắn SMS cho các đơn hàng quan trọng</div>
                            </div>
                            <div
                                className={`${styles.toggleSwitch} ${settings.smsNotif ? styles.on : ''}`}
                                onClick={() => handleToggle('smsNotif')}
                            >
                                <div className={styles.toggleKnob} />
                            </div>
                        </div>
                    </div>
                    <div className={styles.sectionFooter}>
                        <button className={styles.saveBtn} onClick={saveNotifications} disabled={saving}>
                            {saving ? 'ĐANG LƯU...' : '💾 LƯU CÀI ĐẶT'}
                        </button>
                    </div>
                </div>
            )}

            {/* ─── SHIPPING TAB ─── */}
            {activeTab === 'shipping' && (
                <>
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionTitle}>Phí vận chuyển</div>
                            <div className={styles.sectionDesc}>Cấu hình phí ship cho từng khu vực</div>
                        </div>
                        <div className={styles.sectionBody}>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Nội thành TP.HCM</label>
                                    <input className={styles.formInput} name="shippingInner" type="number" value={settings.shippingInner} onChange={handleNumberChange} />
                                    <span className={styles.formHint}>VNĐ / đơn</span>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Ngoại thành TP.HCM</label>
                                    <input className={styles.formInput} name="shippingOuter" type="number" value={settings.shippingOuter} onChange={handleNumberChange} />
                                    <span className={styles.formHint}>VNĐ / đơn</span>
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Miền Nam</label>
                                    <input className={styles.formInput} name="shippingSouth" type="number" value={settings.shippingSouth} onChange={handleNumberChange} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Miền Bắc / Trung</label>
                                    <input className={styles.formInput} name="shippingNorth" type="number" value={settings.shippingNorth} onChange={handleNumberChange} />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Miễn phí ship từ (VNĐ)</label>
                                <input className={styles.formInput} name="freeShipMinOrder" type="number" value={settings.freeShipMinOrder} onChange={handleNumberChange} />
                                <span className={styles.formHint}>Đơn hàng từ giá trị này trở lên sẽ được freeship</span>
                            </div>
                        </div>
                        <div className={styles.sectionFooter}>
                            <button className={styles.saveBtn} onClick={saveShipping} disabled={saving}>
                                {saving ? 'ĐANG LƯU...' : '💾 LƯU PHÍ SHIP'}
                            </button>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionTitle}>Đối tác vận chuyển</div>
                        </div>
                        <div className={styles.sectionBody}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>GHTK — API Token</label>
                                <input className={styles.formInput} name="ghtkToken" type="password" value={settings.ghtkToken} onChange={handleChange} placeholder="Nhập API token GHTK..." />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>GHN — API Token</label>
                                <input className={styles.formInput} name="ghnToken" type="password" value={settings.ghnToken} onChange={handleChange} placeholder="Nhập API token GHN..." />
                            </div>
                        </div>
                        <div className={styles.sectionFooter}>
                            <button className={styles.saveBtn} onClick={saveShippingApi} disabled={saving}>
                                {saving ? 'ĐANG LƯU...' : '💾 LƯU API'}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* ─── APPEARANCE TAB ─── */}
            {activeTab === 'appearance' && (
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionTitle}>Tùy chỉnh giao diện</div>
                        <div className={styles.sectionDesc}>Thay đổi màu sắc và logo hiển thị của cửa hàng</div>
                    </div>
                    <div className={styles.sectionBody}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Accent chính</label>
                            <div className={styles.colorRow}>
                                <input
                                    type="color"
                                    name="primaryColor"
                                    value={settings.primaryColor}
                                    onChange={handleChange}
                                    className={styles.colorPicker}
                                    style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
                                />
                                <div>
                                    <div className={styles.colorLabel}>Primary</div>
                                    <div className={styles.colorCode}>{settings.primaryColor.toUpperCase()}</div>
                                </div>
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Accent phụ</label>
                            <div className={styles.colorRow}>
                                <input
                                    type="color"
                                    name="accentColor"
                                    value={settings.accentColor}
                                    onChange={handleChange}
                                    className={styles.colorPicker}
                                    style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
                                />
                                <div>
                                    <div className={styles.colorLabel}>Accent</div>
                                    <div className={styles.colorCode}>{settings.accentColor.toUpperCase()}</div>
                                </div>
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Logo cửa hàng</label>
                            {/* Preview */}
                            {settings.logoUrl && (
                                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={settings.logoUrl} alt="Logo preview" style={{ height: '48px', maxWidth: '180px', objectFit: 'contain', background: '#1a1a1a', borderRadius: '6px', padding: '6px' }} />
                                    <button
                                        type="button"
                                        onClick={() => setSettings(prev => ({ ...prev, logoUrl: '' }))}
                                        style={{ fontSize: '11px', color: '#E53E3E', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                    >
                                        ✕ Xóa logo
                                    </button>
                                </div>
                            )}
                            {/* Upload button */}
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input className={styles.formInput} name="logoUrl" value={settings.logoUrl} onChange={handleChange} placeholder="https://... hoặc upload bên dưới" style={{ flex: 1 }} />
                                <label style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    padding: '8px 14px', background: 'var(--color-cyan, #00C4AD)', color: '#000',
                                    borderRadius: '4px', cursor: uploadLogo.loading ? 'not-allowed' : 'pointer',
                                    fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', opacity: uploadLogo.loading ? 0.6 : 1
                                }}>
                                    {uploadLogo.loading ? '⏳ Đang tải...' : '↑ Upload'}
                                    <input type="file" accept="image/*" onChange={handleLogoFile} style={{ display: 'none' }} disabled={uploadLogo.loading} />
                                </label>
                            </div>
                            {uploadLogo.error && <span style={{ color: '#E53E3E', fontSize: '12px' }}>{uploadLogo.error}</span>}
                            <span className={styles.formHint}>SVG, PNG trong suốt — khuyến nghị tối thiểu 200×60px</span>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Favicon</label>
                            {settings.faviconUrl && (
                                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={settings.faviconUrl} alt="Favicon preview" style={{ height: '32px', width: '32px', objectFit: 'contain', background: '#1a1a1a', borderRadius: '4px', padding: '4px' }} />
                                    <button
                                        type="button"
                                        onClick={() => setSettings(prev => ({ ...prev, faviconUrl: '' }))}
                                        style={{ fontSize: '11px', color: '#E53E3E', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                    >
                                        ✕ Xóa favicon
                                    </button>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input className={styles.formInput} name="faviconUrl" value={settings.faviconUrl} onChange={handleChange} placeholder="https://... hoặc upload" style={{ flex: 1 }} />
                                <label style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    padding: '8px 14px', background: 'var(--color-cyan, #00C4AD)', color: '#000',
                                    borderRadius: '4px', cursor: uploadFavicon.loading ? 'not-allowed' : 'pointer',
                                    fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', opacity: uploadFavicon.loading ? 0.6 : 1
                                }}>
                                    {uploadFavicon.loading ? '⏳ Đang tải...' : '↑ Upload'}
                                    <input type="file" accept="image/png,image/x-icon,image/svg+xml,image/webp" onChange={handleFaviconFile} style={{ display: 'none' }} disabled={uploadFavicon.loading} />
                                </label>
                            </div>
                            {uploadFavicon.error && <span style={{ color: '#E53E3E', fontSize: '12px' }}>{uploadFavicon.error}</span>}
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Banner trang chủ</label>
                            <input className={styles.formInput} name="bannerText" value={settings.bannerText} onChange={handleChange} placeholder="Text hiển thị trên hero banner" />
                        </div>
                        <div className={styles.formGroup} style={{ marginTop: '20px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                            <div className={styles.toggleRow} style={{ margin: 0 }}>
                                <div className={styles.toggleInfo}>
                                    <div className={styles.toggleLabel}>Hiển thị Landing Page</div>
                                    <div className={styles.toggleDesc}>
                                        Bật: Hiển thị trang giới thiệu với 3D Hero, Stories.<br/>
                                        Tắt: Khách vào trang chủ sẽ thấy ngay lưới Sản phẩm trực tiếp.
                                    </div>
                                </div>
                                <div
                                    className={`${styles.toggleSwitch} ${settings.showLandingPage ? styles.on : ''}`}
                                    onClick={() => handleToggle('showLandingPage')}
                                >
                                    <div className={styles.toggleKnob} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={styles.sectionFooter}>
                        <button className={styles.saveBtn} onClick={saveAppearance} disabled={saving}>
                            {saving ? 'ĐANG LƯU...' : '💾 LƯU GIAO DIỆN'}
                        </button>
                    </div>
                </div>
            )}

            {/* ─── NAVIGATION MENU TAB ─── */}
            {activeTab === 'navigation' && (
                <div className={styles.menuTabWrapper}>
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionTitle}>Cấu hình Menu Header</div>
                            <div className={styles.sectionDesc}>Kéo thả để sắp xếp, thêm mới, sửa hoặc xóa các mô đun menu trên thanh điều hướng website</div>
                        </div>

                        <div className={styles.sectionBody}>
                            {/* Form thêm menu cha mới */}
                            <div className={styles.menuCreatorBox} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
                                <div className={styles.creatorTitle} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-cyan)', fontWeight: 'bold', marginBottom: '12px' }}>➕ THÊM MENU MỚI</div>
                                <div className={styles.creatorGrid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Tên hiển thị (VD: Bàn phím cơ)" 
                                        id="newMenuLabel"
                                        className={styles.formInput} 
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Đường dẫn (VD: /products)" 
                                        id="newMenuHref"
                                        className={styles.formInput} 
                                    />
                                </div>
                                <div className={styles.checkboxRow} style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                                        <input type="checkbox" id="newMenuMega" />
                                        <span>Mega Menu (Tự động đồng bộ danh mục)</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                                        <input type="checkbox" id="newMenuHighlight" />
                                        <span>Nổi bật (Highlight màu đỏ)</span>
                                    </label>
                                </div>
                                <button 
                                    type="button" 
                                    className={styles.saveBtn}
                                    style={{ width: 'auto', padding: '10px 20px', fontSize: '12px' }}
                                    onClick={() => {
                                        const labelEl = document.getElementById('newMenuLabel') as HTMLInputElement;
                                        const hrefEl = document.getElementById('newMenuHref') as HTMLInputElement;
                                        const megaEl = document.getElementById('newMenuMega') as HTMLInputElement;
                                        const highEl = document.getElementById('newMenuHighlight') as HTMLInputElement;

                                        if (!labelEl?.value || !hrefEl?.value) {
                                            error('Vui lòng nhập đầy đủ tên và đường dẫn!');
                                            return;
                                        }

                                        const newItem = {
                                            id: `menu-${Date.now()}`,
                                            label: labelEl.value,
                                            href: hrefEl.value,
                                            isMegaMenu: megaEl.checked,
                                            highlight: highEl.checked,
                                            children: []
                                        };

                                        setSettings(prev => ({
                                            ...prev,
                                            headerMenu: [...(prev.headerMenu || []), newItem]
                                        }));

                                        labelEl.value = '';
                                        hrefEl.value = '';
                                        megaEl.checked = false;
                                        highEl.checked = false;
                                        success('Đã thêm menu mới! Hãy bấm Lưu cấu hình bên dưới để lưu.');
                                    }}
                                >
                                    THÊM VÀO DANH SÁCH MENU
                                </button>
                            </div>

                            {/* Danh sách kéo thả */}
                            <div className={styles.menuDragList} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {(settings.headerMenu || []).map((item, index) => {
                                    return (
                                        <div 
                                            key={item.id}
                                            className={styles.dragItem}
                                            style={{
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                borderRadius: '6px',
                                                padding: '12px',
                                                cursor: 'move'
                                            }}
                                            draggable
                                            onDragStart={(e) => {
                                                e.dataTransfer.setData('text/plain', String(index));
                                            }}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                            }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                const dragIdx = Number(e.dataTransfer.getData('text/plain'));
                                                const newMenu = [...(settings.headerMenu || [])];
                                                const [removed] = newMenu.splice(dragIdx, 1);
                                                newMenu.splice(index, 0, removed);
                                                setSettings(prev => ({ ...prev, headerMenu: newMenu }));
                                            }}
                                        >
                                            <div className={styles.dragHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ color: 'var(--color-ink3)', fontSize: '18px' }}>☰</div>
                                                    <span style={{ fontWeight: 'bold', color: item.highlight ? 'var(--color-accent)' : 'inherit' }}>{item.label}</span>
                                                    <code style={{ fontSize: '11px', color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>{item.href}</code>
                                                    {item.isMegaMenu && <span style={{ fontSize: '10px', background: 'rgba(0, 196, 173, 0.1)', color: 'var(--color-cyan)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>MEGA</span>}
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button 
                                                        type="button"
                                                        style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                                                        onClick={() => {
                                                            const subName = prompt('Nhập tên menu con (VD: Sửa chữa Laptop):');
                                                            const subHref = prompt('Nhập đường dẫn liên kết (VD: /sua-chua-laptop):', item.href);
                                                            const subDesc = prompt('Mô tả ngắn (VD: Chẩn đoán nhanh chóng):') || '';
                                                            if (!subName || !subHref) return;

                                                            const newChildren = [...(item.children || []), {
                                                                id: `sub-${Date.now()}`,
                                                                label: subName,
                                                                href: subHref,
                                                                desc: subDesc
                                                            }];

                                                            const newMenu = (settings.headerMenu || []).map(x => 
                                                                x.id === item.id ? { ...x, children: newChildren } : x
                                                            );
                                                            setSettings(prev => ({ ...prev, headerMenu: newMenu }));
                                                        }}
                                                    >
                                                        + Thêm menu con
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        style={{ background: 'rgba(229, 62, 62, 0.15)', color: '#E53E3E', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                                                        onClick={() => {
                                                            const newMenu = (settings.headerMenu || []).filter(x => x.id !== item.id);
                                                            setSettings(prev => ({ ...prev, headerMenu: newMenu }));
                                                        }}
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Submenu lists */}
                                            {item.children && item.children.length > 0 && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', paddingLeft: '24px', borderLeft: '1px dashed rgba(255,255,255,0.1)' }}>
                                                    {item.children.map((sub, subIdx) => (
                                                        <div key={sub.id || subIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '6px 12px', borderRadius: '4px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                                                                <span style={{ color: 'var(--color-ink3)' }}>↳</span>
                                                                <strong>{sub.label}</strong>
                                                                <code style={{ fontSize: '10px', color: 'var(--color-ink3)' }}>{sub.href}</code>
                                                                {sub.desc && <em style={{ fontSize: '11px', color: 'var(--color-ink3)' }}>- {sub.desc}</em>}
                                                            </div>
                                                            <button 
                                                                type="button"
                                                                style={{ background: 'none', border: 'none', color: '#E53E3E', cursor: 'pointer', fontSize: '12px' }}
                                                                onClick={() => {
                                                                    const newChildren = item.children?.filter(x => x.id !== sub.id);
                                                                    const newMenu = (settings.headerMenu || []).map(x => 
                                                                        x.id === item.id ? { ...x, children: newChildren } : x
                                                                    );
                                                                    setSettings(prev => ({ ...prev, headerMenu: newMenu }));
                                                                }}
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className={styles.sectionFooter}>
                            <button 
                                className={styles.saveBtn} 
                                onClick={() => saveSettings({ headerMenu: settings.headerMenu })} 
                                disabled={saving}
                            >
                                {saving ? 'ĐANG LƯU CẤU HÌNH...' : '💾 LƯU CẤU HÌNH MENU HEADER'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
