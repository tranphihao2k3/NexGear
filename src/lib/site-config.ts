import dbConnect from '@/lib/mongodb';
import Setting from '@/models/Setting';

export interface SiteSettings {
    storeName: string;
    siteTitle: string;
    siteTitleTemplate: string;
    siteDescription: string;
    siteTagline: string;
    siteDomain: string;
    siteKeywords: string;
    ogImage: string;
    storePhone: string;
    storeEmail: string;
    storeAddress: string;
    taxCode: string;
    logoUrl: string;
    faviconUrl: string;
    facebook: string;
    instagram: string;
    tiktok: string;
    facebookPageId: string;
    googleMapsEmbedUrl: string;
    showLandingPage: boolean;
    // Bank & Payment (BCT compliance)
    bankAccountName: string;
    bankAccountNumber: string;
    bankName: string;
    // Bộ Công Thương
    bctLink: string;
    bctType: 'notified' | 'registered';
    // Drag-and-drop customizable header menu
    headerMenu?: {
        id: string;
        label: string;
        href: string;
        isMegaMenu: boolean;
        highlight: boolean;
        children?: { id: string; label: string; href: string; desc?: string }[];
    }[];
}

const DEFAULTS: SiteSettings = {
    storeName: 'Thành Võ Laptop',
    siteTitle: 'Thành Võ LapTop Chính Hãng Cần Thơ',
    siteTitleTemplate: '%s | Thành Võ LapTop',
    siteDescription: 'Thành Võ LapTop máy tính chính hãng #1 Cần Thơ. Laptop, bàn phím cơ, chuột gaming, tai nghe, loa, micro và phụ kiện. Giao nhanh 2H, bảo hành 12T.',
    siteTagline: 'LapTop Thành Võ STORE',
    siteDomain: 'https://laptopthanhvo.com',
    siteKeywords: 'laptop Cần Thơ, laptop chính hãng, laptop gaming, bàn phím cơ, chuột gaming, phụ kiện laptop, Thành Võ Laptop, laptopthanhvo',
    ogImage: '/og-image.jpg',
    storePhone: '097 890 96 07',
    storeEmail: 'thanhb1412520000@gmail.com',
    storeAddress: '102/10a Trần Hoàng Na, Ninh Kiều, Cần Thơ',
    taxCode: '',
    logoUrl: '',
    faviconUrl: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    facebookPageId: '',
    googleMapsEmbedUrl: '',
    showLandingPage: true,
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
        { id: '5', label: 'Tra cứu bảo hành', href: '/warranty-policy', isMegaMenu: false, highlight: false },
        { id: '6', label: 'Flash Deal', href: '/deals', isMegaMenu: false, highlight: true },
        { id: '7', label: '🧪 Test Laptop', href: '/test-laptop', isMegaMenu: false, highlight: false }
    ]
};

// Cache settings per siteId to support multi-tenant deployments
let settingsCache: Record<string, { data: SiteSettings; timestamp: number }> = {};
const CACHE_TTL = 60 * 1000; // 1 minute

export async function getSiteSettings(idOrHost?: string): Promise<SiteSettings> {
    const now = Date.now();

    // ⚠️  MULTI-TENANT RULE:
    // Luôn truyền `host` từ request header vào hàm này.
    // Khi deploy production: mỗi domain → đúng shop.
    // Khi dev localhost: dùng NEXT_PUBLIC_SITE_ID để chọn shop.
    if (!idOrHost && process.env.NODE_ENV === 'development') {
        console.warn(
            '[getSiteSettings] Called without host argument. ' +
            'This will fall back to NEXT_PUBLIC_SITE_ID or "laptopthanhvo". ' +
            'Pass headers().get("host") for correct multi-tenant behavior.'
        );
    }

    // Khi chạy trên localhost (dev mode), ignore host và dùng NEXT_PUBLIC_SITE_ID.
    // Bỏ tiền tố "www." để www.laptopthanhvo.com và laptopthanhvo.com trỏ về cùng shop.
    const rawIdentifier = (idOrHost || '').replace(/^www\./i, '');
    const isLocalhost = rawIdentifier === '' || rawIdentifier.startsWith('localhost');
    const identifier = isLocalhost
        ? (process.env.NEXT_PUBLIC_SITE_ID || 'laptopthanhvo')
        : rawIdentifier;
    
    // Return from cache if valid
    if (settingsCache[identifier] && now - settingsCache[identifier].timestamp < CACHE_TTL) {
        return settingsCache[identifier].data;
    }

    try {
        await dbConnect();
        
        let settings = null;
        
        // 1. Try finding by siteId first (exact match)
        settings = await Setting.findOne({ siteId: identifier }).lean();
        
        // 2. If not found and identifier looks like a domain/host, try finding by siteDomain
        if (!settings && (identifier.includes('.') || identifier.includes('localhost'))) {
            // Clean host (remove port if exists)
            const cleanHost = identifier.split(':')[0];
            settings = await Setting.findOne({ 
                $or: [
                    { siteDomain: { $regex: cleanHost, $options: 'i' } },
                    { siteId: identifier }
                ] 
            }).lean();
        }
        
        // 3. Auto-migration / Fallback for 'laptopthanhvo'
        if (!settings && identifier === 'laptopthanhvo') {
            const tempSettings = await Setting.findOne({ siteId: { $exists: false } });
            if (tempSettings) {
                tempSettings.siteId = 'laptopthanhvo';
                await tempSettings.save();
                settings = tempSettings.toObject();
            }
        }
        
        let result: SiteSettings;
        if (settings) {
            result = {
                storeName: (settings as any).storeName || DEFAULTS.storeName,
                siteTitle: (settings as any).siteTitle || DEFAULTS.siteTitle,
                siteTitleTemplate: (settings as any).siteTitleTemplate || DEFAULTS.siteTitleTemplate,
                siteDescription: (settings as any).siteDescription || DEFAULTS.siteDescription,
                siteTagline: (settings as any).siteTagline || DEFAULTS.siteTagline,
                siteDomain: (settings as any).siteDomain || DEFAULTS.siteDomain,
                siteKeywords: (settings as any).siteKeywords || DEFAULTS.siteKeywords,
                ogImage: (settings as any).ogImage || DEFAULTS.ogImage,
                storePhone: (settings as any).storePhone || DEFAULTS.storePhone,
                storeEmail: (settings as any).storeEmail || DEFAULTS.storeEmail,
                storeAddress: (settings as any).storeAddress || DEFAULTS.storeAddress,
                taxCode: (settings as any).taxCode || DEFAULTS.taxCode,
                logoUrl: (settings as any).logoUrl || DEFAULTS.logoUrl,
                faviconUrl: (settings as any).faviconUrl || DEFAULTS.faviconUrl,
                facebook: (settings as any).facebook || DEFAULTS.facebook,
                instagram: (settings as any).instagram || DEFAULTS.instagram,
                tiktok: (settings as any).tiktok || DEFAULTS.tiktok,
                facebookPageId: (settings as any).facebookPageId || DEFAULTS.facebookPageId,
                googleMapsEmbedUrl: (settings as any).googleMapsEmbedUrl || DEFAULTS.googleMapsEmbedUrl,
                showLandingPage: (settings as any).showLandingPage ?? DEFAULTS.showLandingPage,
                bankAccountName: (settings as any).bankAccountName || DEFAULTS.bankAccountName,
                bankAccountNumber: (settings as any).bankAccountNumber || DEFAULTS.bankAccountNumber,
                bankName: (settings as any).bankName || DEFAULTS.bankName,
                bctLink: (settings as any).bctLink || DEFAULTS.bctLink,
                bctType: (settings as any).bctType || DEFAULTS.bctType,
                headerMenu: (settings as any).headerMenu || DEFAULTS.headerMenu,
            };
        } else {
            result = { ...DEFAULTS };
        }
        
        // Update cache for this identifier
        settingsCache[identifier] = { data: result, timestamp: now };
        return result;
    } catch (error) {
        console.error('Error fetching site settings:', error);
        return { ...DEFAULTS };
    }
}

export { DEFAULTS as SITE_DEFAULTS };

/**
 * Single call for layout: returns siteSettings + brand colors.
 * Avoids duplicate dbConnect + Setting.findOne in layout.tsx.
 */
export async function getRawSiteSettings(idOrHost?: string): Promise<{
    siteSettings: SiteSettings;
    primaryColor: string;
    accentColor: string;
}> {
    const rawIdentifier = (idOrHost || '').replace(/^www\./i, '');
    const isLocalhost = rawIdentifier === '' || rawIdentifier.startsWith('localhost');
    const identifier = isLocalhost
        ? (process.env.NEXT_PUBLIC_SITE_ID || 'laptopthanhvo')
        : rawIdentifier;

    let primaryColor = '#00C4AD';
    let accentColor = '#F0356A';

    try {
        await dbConnect();
        let rawSettings = await Setting.findOne({ siteId: identifier }).lean() as any;
        if (!rawSettings && (identifier.includes('.') || identifier.includes('localhost'))) {
            const cleanHost = identifier.split(':')[0];
            rawSettings = await Setting.findOne({
                $or: [
                    { siteDomain: { $regex: cleanHost, $options: 'i' } },
                    { siteId: identifier }
                ]
            }).lean() as any;
        }
        if (!rawSettings && identifier === 'laptopthanhvo') {
            rawSettings = await Setting.findOne({ siteId: { $exists: false } }).lean() as any;
        }

        if (rawSettings?.primaryColor) primaryColor = rawSettings.primaryColor;
        if (rawSettings?.accentColor) accentColor = rawSettings.accentColor;

        // Build siteSettings from same rawSettings — no second DB call
        const s = rawSettings || {};
        const siteSettings: SiteSettings = {
            storeName: s.storeName || DEFAULTS.storeName,
            siteTitle: s.siteTitle || DEFAULTS.siteTitle,
            siteTitleTemplate: s.siteTitleTemplate || DEFAULTS.siteTitleTemplate,
            siteDescription: s.siteDescription || DEFAULTS.siteDescription,
            siteTagline: s.siteTagline || DEFAULTS.siteTagline,
            siteDomain: s.siteDomain || DEFAULTS.siteDomain,
            siteKeywords: s.siteKeywords || DEFAULTS.siteKeywords,
            ogImage: s.ogImage || DEFAULTS.ogImage,
            storePhone: s.storePhone || DEFAULTS.storePhone,
            storeEmail: s.storeEmail || DEFAULTS.storeEmail,
            storeAddress: s.storeAddress || DEFAULTS.storeAddress,
            taxCode: s.taxCode || DEFAULTS.taxCode,
            logoUrl: s.logoUrl || DEFAULTS.logoUrl,
            faviconUrl: s.faviconUrl || DEFAULTS.faviconUrl,
            facebook: s.facebook || DEFAULTS.facebook,
            instagram: s.instagram || DEFAULTS.instagram,
            tiktok: s.tiktok || DEFAULTS.tiktok,
            facebookPageId: s.facebookPageId || DEFAULTS.facebookPageId,
            googleMapsEmbedUrl: s.googleMapsEmbedUrl || DEFAULTS.googleMapsEmbedUrl,
            showLandingPage: s.showLandingPage ?? DEFAULTS.showLandingPage,
            bankAccountName: s.bankAccountName || DEFAULTS.bankAccountName,
            bankAccountNumber: s.bankAccountNumber || DEFAULTS.bankAccountNumber,
            bankName: s.bankName || DEFAULTS.bankName,
            bctLink: s.bctLink || DEFAULTS.bctLink,
            bctType: s.bctType || DEFAULTS.bctType,
            headerMenu: s.headerMenu || DEFAULTS.headerMenu,
        };

        // Update cache so getSiteSettings() won't re-query
        settingsCache[identifier] = { data: siteSettings, timestamp: Date.now() };

        return { siteSettings, primaryColor, accentColor };
    } catch (error) {
        console.error('Error fetching raw site settings:', error);
        return { siteSettings: { ...DEFAULTS }, primaryColor, accentColor };
    }
}

/**
 * Xóa cache settings của một hoặc tất cả shop.
 * Gọi sau khi admin lưu cài đặt để trang phản ánh ngay.
 */
export function clearSiteCache(idOrHost?: string) {
    if (idOrHost) {
        delete settingsCache[idOrHost];
    } else {
        settingsCache = {};
    }
}
