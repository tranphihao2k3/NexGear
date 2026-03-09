import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Blog from '@/models/Blog';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

// GET /api/blog/[id] - also supports fetching by slug
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const isObjectId = /^[a-f\d]{24}$/i.test(id);
        const blog = isObjectId
            ? await Blog.findById(id).lean()
            : await Blog.findOne({ slug: id }).lean();

        if (!blog) return apiError('Blog not found', 404);

        return apiSuccess(blog);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/blog/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        // Ensure uniqueness when updating slug
        if (body.slug) {
            const checkSlug = await Blog.findOne({
                slug: body.slug,
                _id: { $ne: id }
            });
            if (checkSlug) return apiError('Blog slug already in use', 400);
        }

        const existing = await Blog.findById(id);
        if (!existing) return apiError('Blog not found', 404);

        if (body.status === 'published' && existing.status !== 'published' && !body.publishedAt) {
            body.publishedAt = new Date();
        }

        const blog = await Blog.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        }).lean();

        return apiSuccess(blog);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/blog/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const blog = await Blog.findByIdAndDelete(id);
        if (!blog) return apiError('Blog not found', 404);

        return apiSuccess({ message: 'Blog deleted' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
