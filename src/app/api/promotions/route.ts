import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Promotion from '@/models/Promotion';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/promotions
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        if (searchParams.get('status')) filter.status = searchParams.get('status');
        if (searchParams.get('discountType')) filter.discountType = searchParams.get('discountType');

        if (searchParams.get('isActive') === 'true') {
            filter.isActive = true;
        } else if (searchParams.get('isActive') === 'false') {
            filter.isActive = false;
        }

        const validAt = searchParams.get('validAt');
        if (validAt) {
            const date = new Date(validAt);
            filter.startDate = { $lte: date };
            filter.endDate = { $gte: date };
            filter.isActive = true;
        }

        const search = searchParams.get('search') || searchParams.get('q');
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
            ];
        }

        const [promotions, total] = await Promise.all([
            Promotion.find(filter)
                .populate('applicableProducts', 'name sku price images')
                .populate('applicableCategories', 'name slug')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Promotion.countDocuments(filter),
        ]);

        return apiPaginated(promotions, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/promotions
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.name || !body.discountType || body.discountValue === undefined || !body.startDate || !body.endDate) {
            return apiError('name, discountType, discountValue, startDate and endDate are required', 400);
        }

        if (body.code) {
            const existingCode = await Promotion.findOne({ code: body.code });
            if (existingCode) return apiError('Promotion code already exists', 400);
        }

        const promotion = await Promotion.create(body);
        return apiSuccess(promotion, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
