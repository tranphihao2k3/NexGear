import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Setting from '@/models/Setting';

export async function GET() {
    try {
        await dbConnect();
        const siteId = process.env.NEXT_PUBLIC_SITE_ID || 'nexgear';
        let setting = await Setting.findOne({ siteId });
        
        // Auto-migration for existing database that doesn't have siteId yet
        if (!setting && siteId === 'nexgear') {
            setting = await Setting.findOne({ siteId: { $exists: false } });
            if (setting) {
                setting.siteId = 'nexgear';
                await setting.save();
            }
        }
        
        if (!setting) {
            setting = await Setting.create({ siteId });
        }
        return NextResponse.json({ success: true, data: setting });
    } catch (error) {
        return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        await dbConnect();
        const siteId = process.env.NEXT_PUBLIC_SITE_ID || 'nexgear';
        const body = await req.json();
        let setting = await Setting.findOne({ siteId });
        if (!setting) {
            setting = new Setting({ siteId });
        }

        // Update all fields that are present in the body
        const allowedFields = [
            // Appearance
            'primaryColor', 'accentColor', 'logoUrl', 'faviconUrl', 'bannerText',
            // General
            'storeName', 'storeEmail', 'storePhone', 'storeAddress', 'taxCode', 'currency',
            // SEO & Site Identity
            'siteTitle', 'siteTitleTemplate', 'siteDescription', 'siteTagline', 'siteDomain', 'siteKeywords', 'ogImage',
            // Social
            'facebook', 'instagram', 'tiktok',
            // Danger zone
            'maintenanceMode',
            // Notifications
            'emailOrderNotif', 'emailDailyReport', 'stockAlertNotif', 'smsNotif',
            // Shipping
            'shippingInner', 'shippingOuter', 'shippingSouth', 'shippingNorth',
            'freeShipMinOrder', 'ghtkToken', 'ghnToken',
        ];

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                (setting as any)[field] = body[field];
            }
        }

        await setting.save();
        return NextResponse.json({ success: true, data: setting });
    } catch (error) {
        return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
    }
}
