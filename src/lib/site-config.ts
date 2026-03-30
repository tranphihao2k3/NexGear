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
    logoUrl: string;
    faviconUrl: string;
    facebook: string;
    instagram: string;
    tiktok: string;
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
    storePhone: '0901 234 567',
    storeEmail: 'contact@nexgzone.top',
    storeAddress: '123 Nguyễn Huệ, Quận 1, TP.HCM',
    logoUrl: 'https://cdn.nexgzone.top/logo.svg',
    faviconUrl: 'https://cdn.nexgzone.top/favicon.ico',
    facebook: '',
    instagram: '',
    tiktok: '',
};

let cachedSettings: SiteSettings | null = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

export async function getSiteSettings(): Promise<SiteSettings> {
    const now = Date.now();
    if (cachedSettings && now - cacheTime < CACHE_TTL) {
        return cachedSettings;
    }

    try {
        await dbConnect();
        const siteId = process.env.NEXT_PUBLIC_SITE_ID || 'nexgear';
        let settings = await Setting.findOne({ siteId }).lean();
        
        // Auto-migration for existing database that doesn't have siteId yet
        if (!settings && siteId === 'nexgear') {
            const tempSettings = await Setting.findOne({ siteId: { $exists: false } });
            if (tempSettings) {
                tempSettings.siteId = 'nexgear';
                await tempSettings.save();
                settings = tempSettings.toObject(); // Use the newly saved document
            }
        }
        
        if (settings) {
            cachedSettings = {
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
                logoUrl: (settings as any).logoUrl || DEFAULTS.logoUrl,
                faviconUrl: (settings as any).faviconUrl || DEFAULTS.faviconUrl,
                facebook: (settings as any).facebook || DEFAULTS.facebook,
                instagram: (settings as any).instagram || DEFAULTS.instagram,
                tiktok: (settings as any).tiktok || DEFAULTS.tiktok,
            };
        } else {
            cachedSettings = { ...DEFAULTS };
        }
        cacheTime = now;
        return cachedSettings;
    } catch {
        return { ...DEFAULTS };
    }
}

export { DEFAULTS as SITE_DEFAULTS };
