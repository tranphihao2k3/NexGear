import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Software from '@/models/Software';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

// GET /api/software/[id] - supports fetching by slug or ID
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const isObjectId = /^[a-f\d]{24}$/i.test(id);
        const software = isObjectId
            ? await Software.findById(id).lean()
            : await Software.findOne({ slug: id }).lean();

        if (!software) return apiError('Software not found', 404);

        return apiSuccess(software);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/software/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        // Ensure uniqueness when updating slug
        if (body.slug) {
            const checkSlug = await Software.findOne({
                slug: body.slug,
                _id: { $ne: id }
            });
            if (checkSlug) return apiError('Software slug already in use', 400);
        }

        const software = await Software.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        }).lean();

        if (!software) return apiError('Software not found', 404);
        return apiSuccess(software);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/software/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const software = await Software.findByIdAndDelete(id);
        if (!software) return apiError('Software not found', 404);

        return apiSuccess({ message: 'Software record deleted' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
