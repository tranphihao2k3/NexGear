import mongoose, { Schema, Document } from 'mongoose';

export interface ISetting extends Document {
    siteId: string;
    // Appearance
    primaryColor: string;
    accentColor: string;
    logoUrl: string;
    faviconUrl: string;
    bannerText: string;

    // General — Store info
    storeName: string;
    storeEmail: string;
    storePhone: string;
    storeAddress: string;
    taxCode: string;
    currency: string;

    // General — Social links
    facebook: string;
    instagram: string;
    tiktok: string;
    facebookPageId: string;
    googleMapsEmbedUrl: string;

    // SEO & Site Identity
    siteTitle: string;
    siteTitleTemplate: string;
    siteDescription: string;
    siteTagline: string;
    siteDomain: string;
    siteKeywords: string;
    ogImage: string;

    // General — Danger zone
    maintenanceMode: boolean;

    // Notifications
    emailOrderNotif: boolean;
    emailDailyReport: boolean;
    stockAlertNotif: boolean;
    smsNotif: boolean;

    // Shipping
    shippingInner: number;
    shippingOuter: number;
    shippingSouth: number;
    shippingNorth: number;
    freeShipMinOrder: number;
    ghtkToken: string;
    ghnToken: string;

    // Config Layout
    showLandingPage: boolean;

    // Multi-tenant management
    ownerEmail: string;
    isActive: boolean;
    plan: string;
    customDomain: string;
    isCustomDomainActive: boolean;

    // Bank & Payment (BCT compliance)
    bankAccountName: string;
    bankAccountNumber: string;
    bankName: string;

    // Bộ Công Thương
    bctLink: string;
    bctType: 'notified' | 'registered';

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

const SettingSchema: Schema = new Schema(
    {
        siteId: { type: String, default: 'nexgear', index: true },
        // Appearance
        primaryColor: { type: String, default: '#00C4AD' },
        accentColor: { type: String, default: '#F0356A' },
        logoUrl: { type: String, default: 'https://cdn.nexgzone.top/logo.svg' },
        faviconUrl: { type: String, default: 'https://cdn.nexgzone.top/favicon.ico' },
        bannerText: { type: String, default: 'Dòng sản phẩm phím cơ cao cấp mới nhất đã cập bến NEXGEAR' },

        // General
        storeName: { type: String, default: 'NEXGEAR' },
        storeEmail: { type: String, default: 'contact@nexgzone.top' },
        storePhone: { type: String, default: '0901 234 567' },
        storeAddress: { type: String, default: '123 Nguyễn Huệ, Quận 1, TP.HCM' },
        taxCode: { type: String, default: '' },
        currency: { type: String, default: 'VND' },

        // Social
        facebook: { type: String, default: '' },
        instagram: { type: String, default: '' },
        tiktok: { type: String, default: '' },
        facebookPageId: { type: String, default: '' },
        googleMapsEmbedUrl: { type: String, default: '' },

        // SEO & Site Identity
        siteTitle: { type: String, default: 'NexGear — Gear Máy Tính Chính Hãng Cần Thơ' },
        siteTitleTemplate: { type: String, default: '%s | NexGear' },
        siteDescription: { type: String, default: 'NexGear — shop gear máy tính chính hãng #1 Cần Thơ. Bàn phím cơ, chuột gaming, tai nghe, loa, micro và phụ kiện. Giao nhanh 2H, bảo hành 12T.' },
        siteTagline: { type: String, default: 'NEXT-GEN GEAR STORE' },
        siteDomain: { type: String, default: 'https://nexgzone.top' },
        siteKeywords: { type: String, default: 'gear máy tính Cần Thơ, bàn phím cơ, chuột gaming, tai nghe gaming, phụ kiện PC, nexgear, shop gear Cần Thơ' },
        ogImage: { type: String, default: '/og-image.jpg' },

        // Danger zone
        maintenanceMode: { type: Boolean, default: false },

        // Notifications
        emailOrderNotif: { type: Boolean, default: true },
        emailDailyReport: { type: Boolean, default: true },
        stockAlertNotif: { type: Boolean, default: true },
        smsNotif: { type: Boolean, default: false },

        // Shipping
        shippingInner: { type: Number, default: 20000 },
        shippingOuter: { type: Number, default: 30000 },
        shippingSouth: { type: Number, default: 35000 },
        shippingNorth: { type: Number, default: 45000 },
        freeShipMinOrder: { type: Number, default: 500000 },
        ghtkToken: { type: String, default: '' },
        ghnToken: { type: String, default: '' },
        showLandingPage: { type: Boolean, default: true },

        // Multi-tenant
        ownerEmail: { type: String, default: '' },
        isActive: { type: Boolean, default: true },
        plan: { type: String, default: 'free' },
        customDomain: { type: String, default: '' },
        isCustomDomainActive: { type: Boolean, default: false },

        // Bank & Payment (BCT compliance)
        bankAccountName: { type: String, default: '' },
        bankAccountNumber: { type: String, default: '' },
        bankName: { type: String, default: '' },

        // Bộ Công Thương
        bctLink: { type: String, default: '' },
        bctType: { type: String, default: 'notified', enum: ['notified', 'registered'] },

        // Header Menu Module Schema
        headerMenu: {
            type: [
                {
                    id: { type: String, required: true },
                    label: { type: String, required: true },
                    href: { type: String, required: true },
                    isMegaMenu: { type: Boolean, default: false },
                    highlight: { type: Boolean, default: false },
                    children: [
                        {
                            id: { type: String },
                            label: { type: String },
                            href: { type: String },
                            desc: { type: String }
                        }
                    ]
                }
            ],
            default: [
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
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);
