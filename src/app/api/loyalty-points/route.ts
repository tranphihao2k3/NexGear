import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LoyaltyPoints from '@/models/LoyaltyPoints';
import Customer from '@/models/Customer';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/loyalty-points
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        if (searchParams.get('customer')) filter.customer = searchParams.get('customer');
        if (searchParams.get('pointsType')) filter.pointsType = searchParams.get('pointsType');

        const search = searchParams.get('search') || searchParams.get('q');
        if (search) {
            filter.description = { $regex: search, $options: 'i' };
        }

        const [points, total] = await Promise.all([
            LoyaltyPoints.find(filter)
                .populate('customer', 'name phone email loyaltyPoints')
                .populate('order', 'orderNumber status createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            LoyaltyPoints.countDocuments(filter),
        ]);

        return apiPaginated(points, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/loyalty-points
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.customer || body.points === undefined || !body.pointsType || !body.description) {
            return apiError('customer, points, pointsType, and description are required', 400);
        }

        const customer = await Customer.findById(body.customer);
        if (!customer) return apiError('Customer not found', 404);

        let pointsChange = Number(body.points);
        if (['redeemed', 'expired'].includes(body.pointsType) && pointsChange > 0) {
            pointsChange = -Math.abs(pointsChange);
        }

        if (customer.loyaltyPoints + pointsChange < 0 && body.pointsType !== 'adjusted') {
            return apiError('Not enough loyalty points', 400);
        }

        const loyaltyPoint = await LoyaltyPoints.create({
            ...body,
            points: Math.abs(Number(body.points))
        });

        // Update customer total points
        customer.loyaltyPoints += pointsChange;
        await customer.save();

        return apiSuccess(loyaltyPoint, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
