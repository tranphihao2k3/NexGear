import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/coupons
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};
        if (searchParams.get('active') === 'true') {
            filter.isActive = true;
            filter.expireAt = { $gte: new Date() };
        }

        const code = searchParams.get('code');
        if (code) filter.code = code.toUpperCase();

        const [coupons, total] = await Promise.all([
            Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Coupon.countDocuments(filter),
        ]);

        return apiPaginated(coupons, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/coupons
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.code || !body.type || !body.value || !body.startAt || !body.expireAt) {
            return apiError('code, type, value, startAt, and expireAt are required');
        }

        const existing = await Coupon.findOne({ code: body.code.toUpperCase() });
        if (existing) return apiError('Coupon code already exists');

        const coupon = await Coupon.create(body);
        return apiSuccess(coupon, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
