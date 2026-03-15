import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import RepairOrder from '@/models/RepairOrder';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/repair-orders
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        if (searchParams.get('status')) filter.status = searchParams.get('status');
        if (searchParams.get('phone')) filter.customerPhone = searchParams.get('phone');
        
        const search = searchParams.get('search') || searchParams.get('q');
        if (search) {
            filter.$or = [
                { repairNumber: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } },
                { customerPhone: { $regex: search, $options: 'i' } },
                { 'deviceInfo.brand': { $regex: search, $options: 'i' } },
                { 'deviceInfo.model': { $regex: search, $options: 'i' } }
            ];
        }

        const [orders, total] = await Promise.all([
            RepairOrder.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            RepairOrder.countDocuments(filter),
        ]);

        return apiPaginated(orders, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/repair-orders
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.customerPhone || !body.description || !body.issueType) {
            return apiError('customerPhone, issueType and description are required', 400);
        }

        const newOrder = await RepairOrder.create(body);

        return apiSuccess(newOrder, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
