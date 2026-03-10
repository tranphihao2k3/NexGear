import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Software from '@/models/Software';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/software
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        if (searchParams.get('category')) filter.category = searchParams.get('category');
        if (searchParams.get('status')) filter.status = searchParams.get('status');
        if (searchParams.get('platform')) filter.platform = searchParams.get('platform');
        if (searchParams.get('type')) filter.type = searchParams.get('type');
        if (searchParams.get('autoSetup') === 'true') filter.autoSetup = true;

        const search = searchParams.get('search') || searchParams.get('q');
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { excerpt: { $regex: search, $options: 'i' } },
            ];
        }

        const [softwares, total] = await Promise.all([
            Software.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Software.countDocuments(filter),
        ]);

        return apiPaginated(softwares, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/software
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.title || !body.slug || !body.content) {
            return apiError('title, slug, and content are required', 400);
        }

        const existingSlug = await Software.findOne({ slug: body.slug });
        if (existingSlug) return apiError('Software slug already exists', 400);

        const software = await Software.create(body);
        return apiSuccess(software, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
