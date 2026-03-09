import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Banner from '@/models/Banner';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/banners
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        if (searchParams.get('status')) filter.status = searchParams.get('status');
        if (searchParams.get('position')) filter.position = searchParams.get('position');

        const search = searchParams.get('search') || searchParams.get('q');
        if (search) {
            filter.title = { $regex: search, $options: 'i' };
        }

        const [banners, total] = await Promise.all([
            Banner.find(filter)
                .sort({ position: 1, order: 1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Banner.countDocuments(filter),
        ]);

        return apiPaginated(banners, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/banners
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.title || !body.image) {
            return apiError('title and image are required', 400);
        }

        // Auto-handle scheduled status
        if (body.startDate && new Date() < new Date(body.startDate)) {
            body.status = 'scheduled';
        }

        const banner = await Banner.create(body);
        return apiSuccess(banner, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
