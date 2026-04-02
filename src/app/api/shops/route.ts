import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import Setting from '@/models/Setting';
import User from '@/models/User';
import { apiSuccess, apiError } from '@/lib/api-helpers';

// GET /api/shops — Superadmin: danh sách tất cả shops
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const shops = await Setting.find({})
            .select('siteId storeName storeEmail storePhone siteDomain ownerEmail isActive plan primaryColor createdAt')
            .sort({ createdAt: -1 })
            .lean();

        return apiSuccess(shops);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/shops — Superadmin: tạo shop mới + tài khoản admin cho shop đó
export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const body = await req.json();
        const {
            // Shop info
            siteId,
            storeName,
            siteDomain,
            storePhone,
            storeEmail,
            storeAddress,
            primaryColor,
            plan,
            // Admin account cho shop mới
            adminName,
            adminEmail,
            adminPassword,
        } = body;

        // Validate bắt buộc
        if (!siteId || !storeName || !adminEmail || !adminPassword) {
            return apiError('siteId, storeName, adminEmail và adminPassword là bắt buộc');
        }

        // Kiểm tra siteId chưa tồn tại
        const existingShop = await Setting.findOne({ siteId });
        if (existingShop) {
            return apiError(`Shop với siteId "${siteId}" đã tồn tại`);
        }

        // Kiểm tra email admin chưa tồn tại
        const existingUser = await User.findOne({ email: adminEmail });
        if (existingUser) {
            return apiError(`Email "${adminEmail}" đã được sử dụng`);
        }

        // Tạo Setting document mới cho shop
        const shop = await Setting.create({
            siteId,
            storeName,
            siteDomain: siteDomain || '',
            storePhone: storePhone || '',
            storeEmail: storeEmail || adminEmail,
            storeAddress: storeAddress || '',
            primaryColor: primaryColor || '#00C4AD',
            plan: plan || 'free',
            ownerEmail: adminEmail,
            isActive: true,
        });

        // Hash password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Tạo User admin cho shop mới
        const adminUser = await User.create({
            name: adminName || `Admin ${storeName}`,
            email: adminEmail,
            password: hashedPassword,
            role: 'admin',
            siteId,
        });

        const userObj = adminUser.toObject();
        delete (userObj as any).password;

        return apiSuccess({
            shop,
            admin: userObj,
            message: `Đã tạo shop "${storeName}" và tài khoản admin thành công`,
        }, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
