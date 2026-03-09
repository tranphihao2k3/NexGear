import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Blog from '@/models/Blog';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/blog
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        if (searchParams.get('status')) filter.status = searchParams.get('status');
        if (searchParams.get('author')) filter.author = searchParams.get('author');

        const tag = searchParams.get('tag');
        if (tag) filter.tags = { $in: [tag] };

        const search = searchParams.get('search') || searchParams.get('q');
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { excerpt: { $regex: search, $options: 'i' } },
            ];
        }

        const [blogs, total] = await Promise.all([
            Blog.find(filter)
                .sort({ publishedAt: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Blog.countDocuments(filter),
        ]);

        return apiPaginated(blogs, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/blog
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.title || !body.slug || !body.content) {
            return apiError('title, slug, and content are required', 400);
        }

        const existingSlug = await Blog.findOne({ slug: body.slug });
        if (existingSlug) return apiError('Blog slug already exists', 400);

        if (body.status === 'published' && !body.publishedAt) {
            body.publishedAt = new Date();
        }

        const blog = await Blog.create(body);
        return apiSuccess(blog, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
