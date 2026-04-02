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
}

const DEFAULTS: SiteSettings = {
    storeName: 'NEXGEAR',
    siteTitle: 'NexGear — Gear Máy Tính Chính Hãng Cần Thơ',
    siteTitleTemplate: '%s | NexGear',
    siteDescription: 'NexGear — shop gear máy tính chính hãng #1 Cần Thơ. Bàn phím cơ, chuột gaming, tai nghe, loa, micro và phụ kiện. Giao nhanh 2H, bảo hành 12T.',
    siteTagline: 'NEXT-GEN GEAR STORE',
    siteDomain: 'https://nexgzone.top',
    siteKeywords: 'gear máy tính Cần Thơ, bàn phím cơ, chuột gaming, tai nghe gaming, phụ kiện PC, nexgear, shop gear Cần Thơ',
    ogImage: '/og-image.jpg',
    storePhone: '0978648720',
    storeEmail: 'tranphihao2k3@gmail.com',
    storeAddress: 'Cần Thơ',
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
            'This will fall back to NEXT_PUBLIC_SITE_ID or "nexgear". ' +
            'Pass headers().get("host") for correct multi-tenant behavior.'
        );
    }

    // Khi chạy trên localhost (dev mode), ignore host và dùng NEXT_PUBLIC_SITE_ID
    const rawIdentifier = idOrHost || '';
    const isLocalhost = rawIdentifier === '' || rawIdentifier.startsWith('localhost');
    const identifier = isLocalhost
        ? (process.env.NEXT_PUBLIC_SITE_ID || 'nexgear')
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
        
        // 3. Auto-migration / Fallback for 'nexgear'
        if (!settings && identifier === 'nexgear') {
            const tempSettings = await Setting.findOne({ siteId: { $exists: false } });
            if (tempSettings) {
                tempSettings.siteId = 'nexgear';
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
