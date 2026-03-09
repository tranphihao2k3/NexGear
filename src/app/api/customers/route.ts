import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Customer from '@/models/Customer';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/customers
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        if (searchParams.get('status')) {
            filter.status = searchParams.get('status');
        }

        if (searchParams.get('customerType')) {
            filter.customerType = searchParams.get('customerType');
        }

        const tag = searchParams.get('tag');
        if (tag) filter.tags = { $in: [tag] };

        const search = searchParams.get('search') || searchParams.get('q');
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const [customers, total] = await Promise.all([
            Customer.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Customer.countDocuments(filter),
        ]);

        return apiPaginated(customers, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/customers
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.name || !body.phone) {
            return apiError('name and phone are required', 400);
        }

        const existingPhone = await Customer.findOne({ phone: body.phone });
        if (existingPhone) return apiError('Customer phone already exists', 400);

        if (body.email) {
            const existingEmail = await Customer.findOne({ email: body.email });
            if (existingEmail) return apiError('Customer email already exists', 400);
        }

        const customer = await Customer.create(body);
        return apiSuccess(customer, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
