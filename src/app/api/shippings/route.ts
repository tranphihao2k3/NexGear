import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Shipping from '@/models/Shipping';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/shippings
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        if (searchParams.get('status')) filter.status = searchParams.get('status');
        if (searchParams.get('order')) filter.order = searchParams.get('order');

        const search = searchParams.get('search') || searchParams.get('q');
        if (search) {
            filter.$or = [
                { trackingNumber: { $regex: search, $options: 'i' } },
                { recipientName: { $regex: search, $options: 'i' } },
                { recipientPhone: { $regex: search, $options: 'i' } },
            ];
        }

        const [shippings, total] = await Promise.all([
            Shipping.find(filter)
                .populate('order', 'orderNumber status customer customerType totalAmount')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Shipping.countDocuments(filter),
        ]);

        return apiPaginated(shippings, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/shippings
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.order || !body.recipientName || !body.recipientPhone || !body.shippingAddress) {
            return apiError('order, recipientName, recipientPhone, and shippingAddress are required', 400);
        }

        const existingShipping = await Shipping.findOne({ order: body.order });
        if (existingShipping) return apiError('Shipping record for this order already exists', 400);

        if (body.status === 'delivered' && !body.deliveredDate) body.deliveredDate = new Date();
        if (['picked_up', 'in_transit', 'out_for_delivery'].includes(body.status) && !body.shippedDate) {
            body.shippedDate = new Date();
        }

        const shipping = await Shipping.create(body);
        return apiSuccess(shipping, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
