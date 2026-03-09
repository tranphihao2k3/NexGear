import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PopupBanner from '@/models/PopupBanner';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

// GET /api/popup-banners/[id]
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const popup = await PopupBanner.findById(id).lean();
        if (!popup) return apiError('PopupBanner not found', 404);

        return apiSuccess(popup);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/popup-banners/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        // If isActive true then deactivate others
        if (body.isActive) {
            await PopupBanner.updateMany({ _id: { $ne: id } }, { isActive: false });
        }

        const popup = await PopupBanner.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        }).lean();

        if (!popup) return apiError('PopupBanner not found', 404);
        return apiSuccess(popup);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/popup-banners/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const popup = await PopupBanner.findByIdAndDelete(id);
        if (!popup) return apiError('PopupBanner not found', 404);

        return apiSuccess({ message: 'PopupBanner deleted' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
