import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Component from '@/models/Component';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/components
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        if (searchParams.get('type')) filter.type = searchParams.get('type');
        if (searchParams.get('active')) filter.active = searchParams.get('active') === 'true';

        const search = searchParams.get('search') || searchParams.get('q');
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const [components, total] = await Promise.all([
            Component.find(filter)
                .sort({ type: 1, name: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Component.countDocuments(filter),
        ]);

        return apiPaginated(components, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/components
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.name || !body.type || body.price === undefined) {
            return apiError('name, type, and price are required', 400);
        }

        const component = await Component.create(body);
        return apiSuccess(component, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
