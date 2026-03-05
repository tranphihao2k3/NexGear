import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Brand from '@/models/Brand';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const brand = await Brand.findById(id).lean();
        if (!brand) return apiError('Brand not found', 404);
        return apiSuccess(brand);
    } catch (error) { return apiError((error as Error).message, 500); }
}

export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();
        const brand = await Brand.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();
        if (!brand) return apiError('Brand not found', 404);
        return apiSuccess(brand);
    } catch (error) { return apiError((error as Error).message, 500); }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const brand = await Brand.findByIdAndDelete(id);
        if (!brand) return apiError('Brand not found', 404);
        return apiSuccess({ message: 'Brand deleted' });
    } catch (error) { return apiError((error as Error).message, 500); }
}
