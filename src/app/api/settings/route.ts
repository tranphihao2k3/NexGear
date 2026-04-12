import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Setting from '@/models/Setting';
import { clearSiteCache } from '@/lib/site-config';

/** Xác định siteId từ request host (multi-tenant) */
function getIdentifier(req: NextRequest): string {
    const host = req.headers.get('host') || '';
    const isLocalhost = host === '' || host.startsWith('localhost');
    return isLocalhost
        ? (process.env.NEXT_PUBLIC_SITE_ID || 'nexgear')
        : host.split(':')[0]; // bỏ port nếu có
}

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const identifier = getIdentifier(req);
        let setting = await Setting.findOne({ siteId: identifier });
        
        // Fallback: tìm theo siteDomain nếu chưa có siteId khớp
        if (!setting) {
            setting = await Setting.findOne({ siteDomain: { $regex: identifier, $options: 'i' } });
        }
        // Auto-migration
        if (!setting && identifier === 'nexgear') {
            setting = await Setting.findOne({ siteId: { $exists: false } });
            if (setting) {
                setting.siteId = 'nexgear';
                await setting.save();
            }
        }
        if (!setting) {
            setting = await Setting.create({ siteId: identifier });
        }
        return NextResponse.json({ success: true, data: setting });
    } catch (error) {
        return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        await dbConnect();
        const identifier = getIdentifier(req);
        const body = await req.json();
        let setting = await Setting.findOne({ siteId: identifier });
        if (!setting) {
            // Fallback: tìm theo siteDomain
            setting = await Setting.findOne({ siteDomain: { $regex: identifier, $options: 'i' } });
        }
        if (!setting) {
            setting = new Setting({ siteId: identifier });
        }

        const allowedFields = [
            'primaryColor', 'accentColor', 'logoUrl', 'faviconUrl', 'bannerText',
            'storeName', 'storeEmail', 'storePhone', 'storeAddress', 'taxCode', 'currency',
            'siteTitle', 'siteTitleTemplate', 'siteDescription', 'siteTagline', 'siteDomain', 'siteKeywords', 'ogImage',
            'facebook', 'instagram', 'tiktok', 'facebookPageId', 'googleMapsEmbedUrl',
            'maintenanceMode',
            'emailOrderNotif', 'emailDailyReport', 'stockAlertNotif', 'smsNotif',
            'shippingInner', 'shippingOuter', 'shippingSouth', 'shippingNorth',
            'freeShipMinOrder', 'ghtkToken', 'ghnToken',
            'showLandingPage',
            'bankAccountName', 'bankAccountNumber', 'bankName',
            'bctLink', 'bctType'
        ];

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                (setting as any)[field] = body[field];
            }
        }

        await setting.save();

        // Xóa cache để frontend phản ánh thay đổi ngay lập tức
        clearSiteCache(identifier);
        clearSiteCache(); // Xóa toàn bộ để chắc chắn

        return NextResponse.json({ success: true, data: setting });
    } catch (error) {
        return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
    }
}
