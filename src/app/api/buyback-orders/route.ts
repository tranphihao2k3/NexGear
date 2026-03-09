import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BuybackOrder from '@/models/BuybackOrder';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/buyback-orders
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        if (searchParams.get('status')) filter.status = searchParams.get('status');
        if (searchParams.get('paymentMethod')) filter.paymentMethod = searchParams.get('paymentMethod');

        const search = searchParams.get('search') || searchParams.get('q');
        if (search) {
            filter.$or = [
                { buybackNumber: { $regex: search, $options: 'i' } },
                { sellerName: { $regex: search, $options: 'i' } },
                { sellerPhone: { $regex: search, $options: 'i' } },
            ];
        }

        const [buybacks, total] = await Promise.all([
            BuybackOrder.find(filter)
                .populate('inspectedBy', 'name email')
                .populate('approvedBy', 'name email')
                .populate('voucher', 'code discountValue discountType')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            BuybackOrder.countDocuments(filter),
        ]);

        return apiPaginated(buybacks, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/buyback-orders
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.buybackNumber || !body.sellerName || !body.sellerPhone || body.buyPrice === undefined) {
            return apiError('buybackNumber, sellerName, sellerPhone, and buyPrice are required', 400);
        }

        const existingOrder = await BuybackOrder.findOne({ buybackNumber: body.buybackNumber });
        if (existingOrder) return apiError('Buyback Order number already exists', 400);

        // Auto-set tracking times based on status
        if (body.status === 'inspecting' && !body.inspectedAt) body.inspectedAt = new Date();
        if (body.status === 'approved' || body.status === 'rejected') {
            if (!body.approvedAt) body.approvedAt = new Date();
        }

        const buyback = await BuybackOrder.create(body);
        return apiSuccess(buyback, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
