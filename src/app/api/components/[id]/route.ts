import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Component from '@/models/Component';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

// GET /api/components/[id]
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const component = await Component.findById(id).lean();
        if (!component) return apiError('Component not found', 404);

        return apiSuccess(component);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/components/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        const component = await Component.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        }).lean();

        if (!component) return apiError('Component not found', 404);
        return apiSuccess(component);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/components/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const component = await Component.findByIdAndDelete(id);
        if (!component) return apiError('Component not found', 404);

        return apiSuccess({ message: 'Component deleted' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
