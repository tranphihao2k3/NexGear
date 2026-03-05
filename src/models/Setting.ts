import mongoose, { Schema, Document } from 'mongoose';

export interface ISetting extends Document {
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
}

const SettingSchema: Schema = new Schema(
    {
        // Appearance
        primaryColor: { type: String, default: '#00C4AD' },
        accentColor: { type: String, default: '#F0356A' },
        logoUrl: { type: String, default: 'https://cdn.nexgear.vn/logo.svg' },
        faviconUrl: { type: String, default: 'https://cdn.nexgear.vn/favicon.ico' },
        bannerText: { type: String, default: 'Dòng sản phẩm phím cơ cao cấp mới nhất đã cập bến NEXGEAR' },

        // General
        storeName: { type: String, default: 'NEXGEAR' },
        storeEmail: { type: String, default: 'contact@nexgear.vn' },
        storePhone: { type: String, default: '0901 234 567' },
        storeAddress: { type: String, default: '123 Nguyễn Huệ, Quận 1, TP.HCM' },
        taxCode: { type: String, default: '' },
        currency: { type: String, default: 'VND' },

        // Social
        facebook: { type: String, default: '' },
        instagram: { type: String, default: '' },
        tiktok: { type: String, default: '' },

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
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);
