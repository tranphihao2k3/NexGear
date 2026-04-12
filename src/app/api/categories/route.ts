import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category';
import { invalidateCategoryCache } from '@/lib/category-cache';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/categories — List all categories
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);

        const filter: Record<string, unknown> = {};
        const activeOnly = searchParams.get('active');
        if (activeOnly === 'true') filter.isActive = true;

        const cacheHeaders = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' };

        // Single category by slug
        const slugParam = searchParams.get('slug');
        if (slugParam) {
            const cat = await Category.findOne({ slug: slugParam })
                .populate('parent', 'name slug')
                .lean();
            if (!cat) return apiError('Category not found', 404);
            return apiSuccess(cat, 200, cacheHeaders);
        }

        // Tree mode: return nested structure
        const treeMode = searchParams.get('tree');
        if (treeMode === 'true') {
            const all = await Category.find(filter)
                .sort({ order: 1, name: 1 })
                .lean();

            const map = new Map<string, any>();
            for (const c of all) {
                map.set(c._id.toString(), { ...c, children: [] });
            }

            const roots: any[] = [];
            for (const c of map.values()) {
                if (c.parent) {
                    const p = map.get(c.parent.toString());
                    if (p) p.children.push(c);
                    else roots.push(c);
                } else {
                    roots.push(c);
                }
            }
            return apiSuccess(roots, 200, cacheHeaders);
        }

        // Flat list (default)
        const parentFilter = searchParams.get('parent');
        if (parentFilter === 'null') filter.parent = null;
        else if (parentFilter) filter.parent = parentFilter;

        const { page, limit, skip } = parsePagination(searchParams);
        const [categories, total] = await Promise.all([
            Category.find(filter)
                .populate('parent', 'name slug')
                .sort({ order: 1, name: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Category.countDocuments(filter),
        ]);

        return apiPaginated(categories, total, page, limit, cacheHeaders);
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
        invalidateCategoryCache();
        return apiSuccess(category, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
