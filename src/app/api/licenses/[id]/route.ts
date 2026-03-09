import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import License from '@/models/License';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

// GET /api/licenses/[id]
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const license = await License.findById(id)
            .populate('software', 'title version type developer downloadUrl categories slug')
            .lean();

        if (!license) return apiError('License not found', 404);

        return apiSuccess(license);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/licenses/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        // Ensure uniqueness when updating key
        if (body.key) {
            const checkKey = await License.findOne({
                key: body.key,
                _id: { $ne: id }
            });
            if (checkKey) return apiError('License key already exists', 400);
        }

        const license = await License.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        }).lean();

        if (!license) return apiError('License not found', 404);
        return apiSuccess(license);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/licenses/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const license = await License.findByIdAndDelete(id);
        if (!license) return apiError('License not found', 404);

        return apiSuccess({ message: 'License deleted' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
