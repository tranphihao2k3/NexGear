import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Supplier from '@/models/Supplier';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const supplier = await Supplier.findById(id).lean();
        if (!supplier) return apiError('Supplier not found', 404);
        return apiSuccess(supplier);
    } catch (error) { return apiError((error as Error).message, 500); }
}

export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();
        const supplier = await Supplier.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();
        if (!supplier) return apiError('Supplier not found', 404);
        return apiSuccess(supplier);
    } catch (error) { return apiError((error as Error).message, 500); }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const supplier = await Supplier.findByIdAndDelete(id);
        if (!supplier) return apiError('Supplier not found', 404);
        return apiSuccess({ message: 'Supplier deleted' });
    } catch (error) { return apiError((error as Error).message, 500); }
}
