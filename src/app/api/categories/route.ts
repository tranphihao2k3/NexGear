import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/categories — List all categories
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};
        const activeOnly = searchParams.get('active');
        if (activeOnly === 'true') filter.isActive = true;

        const parentFilter = searchParams.get('parent');
        if (parentFilter === 'null') filter.parent = null;
        else if (parentFilter) filter.parent = parentFilter;

        const [categories, total] = await Promise.all([
            Category.find(filter)
                .populate('parent', 'name slug')
                .sort({ order: 1, name: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Category.countDocuments(filter),
        ]);

        return apiPaginated(categories, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/categories — Create category
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.name || !body.slug) {
            return apiError('name and slug are required');
        }

        const existing = await Category.findOne({ slug: body.slug });
        if (existing) {
            return apiError('A category with this slug already exists');
        }

        const category = await Category.create(body);
        return apiSuccess(category, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
