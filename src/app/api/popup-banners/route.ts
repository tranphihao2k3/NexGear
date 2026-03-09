import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PopupBanner from '@/models/PopupBanner';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/popup-banners
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        if (searchParams.get('isActive') === 'true') {
            filter.isActive = true;
        } else if (searchParams.get('isActive') === 'false') {
            filter.isActive = false;
        }

        const search = searchParams.get('search') || searchParams.get('q');
        if (search) {
            filter.title = { $regex: search, $options: 'i' };
        }

        const [popups, total] = await Promise.all([
            PopupBanner.find(filter)
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            PopupBanner.countDocuments(filter),
        ]);

        return apiPaginated(popups, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/popup-banners
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.title || !body.imageUrl) {
            return apiError('title and imageUrl are required', 400);
        }

        // If isActive true then we might want to deactivate others
        if (body.isActive) {
            await PopupBanner.updateMany({}, { isActive: false });
        }

        const popup = await PopupBanner.create(body);
        return apiSuccess(popup, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
