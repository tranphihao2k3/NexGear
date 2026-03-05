// ============================================================
// NEXGEAR — Admin Settings Page — All tabs connected to API
// ============================================================
'use client'

import { useState, useEffect } from 'react'
import styles from './page.module.scss'
import { CyberpunkLoader, useToast } from '@/components/ui'

type SettingsTab = 'general' | 'notifications' | 'appearance' | 'shipping'

interface SettingsData {
    // Appearance
    primaryColor: string
    accentColor: string
    logoUrl: string
    faviconUrl: string
    bannerText: string
    // General
    storeName: string
    storeEmail: string
    storePhone: string
    storeAddress: string
    taxCode: string
    currency: string
    // Social
    facebook: string
    instagram: string
    tiktok: string
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
}

const DEFAULTS: SettingsData = {
    primaryColor: '#00C4AD',
    accentColor: '#F0356A',
    logoUrl: '',
    faviconUrl: '',
    bannerText: '',
    storeName: 'NEXGEAR',
    storeEmail: 'contact@nexgear.vn',
    storePhone: '0901 234 567',
    storeAddress: '123 Nguyễn Huệ, Quận 1, TP.HCM',
    taxCode: '',
    currency: 'VND',
    facebook: '',
    instagram: '',
    tiktok: '',
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
}

export default function AdminSettingsPage() {
    const { success, error } = useToast()
    const [activeTab, setActiveTab] = useState<SettingsTab>('general')
    const [settings, setSettings] = useState<SettingsData>(DEFAULTS)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

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

    const saveGeneral = () => saveSettings({
        storeName: settings.storeName,
        storeEmail: settings.storeEmail,
        storePhone: settings.storePhone,
        storeAddress: settings.storeAddress,
        taxCode: settings.taxCode,
        currency: settings.currency,
    })

    const saveSocial = () => saveSettings({
        facebook: settings.facebook,
        instagram: settings.instagram,
        tiktok: settings.tiktok,
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
    ]

    if (loading) {
        return <CyberpunkLoader message="Đang tải cài đặt..." />
    }

    return (
        <>
            <div className={styles.header}>
                <h1>Cài đặt</h1>
                <div className={styles.subtitle}>Quản lý cấu hình cửa hàng NEXGEAR</div>
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
                        </div>
                        <div className={styles.sectionFooter}>
                            <button className={styles.saveBtn} onClick={saveGeneral} disabled={saving}>
                                {saving ? 'ĐANG LƯU...' : '💾 LƯU THAY ĐỔI'}
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
                            <label className={styles.formLabel}>Logo (URL)</label>
                            <input className={styles.formInput} name="logoUrl" value={settings.logoUrl} onChange={handleChange} placeholder="https://cdn.nexgear.vn/logo.svg" />
                            <span className={styles.formHint}>Khuyến nghị SVG hoặc PNG trong suốt, tối thiểu 200x200px</span>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Favicon</label>
                            <input className={styles.formInput} name="faviconUrl" value={settings.faviconUrl} onChange={handleChange} placeholder="https://cdn.nexgear.vn/favicon.ico" />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Banner trang chủ</label>
                            <input className={styles.formInput} name="bannerText" value={settings.bannerText} onChange={handleChange} placeholder="Text hiển thị trên hero banner" />
                        </div>
                    </div>
                    <div className={styles.sectionFooter}>
                        <button className={styles.saveBtn} onClick={saveAppearance} disabled={saving}>
                            {saving ? 'ĐANG LƯU...' : '💾 LƯU GIAO DIỆN'}
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
