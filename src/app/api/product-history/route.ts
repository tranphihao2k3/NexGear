import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ProductHistory from '@/models/ProductHistory';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/product-history
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        if (searchParams.get('productUnit')) filter.productUnit = searchParams.get('productUnit');
        if (searchParams.get('eventType')) filter.eventType = searchParams.get('eventType');

        const relatedType = searchParams.get('relatedType');
        const relatedId = searchParams.get('relatedId');
        if (relatedType) filter.relatedType = relatedType;
        if (relatedId) filter.relatedId = relatedId;

        const [history, total] = await Promise.all([
            ProductHistory.find(filter)
                .populate({
                    path: 'productUnit',
                    select: 'sku serialNumber condition batteryCycleCount',
                    populate: { path: 'product', select: 'name sku model' }
                })
                .populate('performedBy', 'name email')
                .sort({ eventDate: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ProductHistory.countDocuments(filter),
        ]);

        return apiPaginated(history, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/product-history
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.productUnit || !body.eventType || !body.description) {
            return apiError('productUnit, eventType, and description are required', 400);
        }

        const history = await ProductHistory.create(body);
        return apiSuccess(history, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
