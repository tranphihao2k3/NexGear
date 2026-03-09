import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Banner from '@/models/Banner';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

// GET /api/banners/[id]
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const banner = await Banner.findById(id).lean();
        if (!banner) return apiError('Banner not found', 404);

        return apiSuccess(banner);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/banners/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        const banner = await Banner.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        }).lean();

        if (!banner) return apiError('Banner not found', 404);
        return apiSuccess(banner);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/banners/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const banner = await Banner.findByIdAndDelete(id);
        if (!banner) return apiError('Banner not found', 404);

        return apiSuccess({ message: 'Banner deleted' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
