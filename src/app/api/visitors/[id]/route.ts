import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Visitor from '@/models/Visitor';
import { apiSuccess, apiError } from '@/lib/api-helpers';

type Props = {
    params: Promise<{ id: string }>;
};

// GET /api/visitors/[id] - get single visitor
export async function GET(req: NextRequest, { params }: Props) {
    try {
        await dbConnect();
        const { id } = await params;
        const visitor = await Visitor.findById(id).lean();
        if (!visitor) return apiError('Visitor not found', 404);
        return apiSuccess(visitor);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/visitors/[id] - update visitor
export async function PUT(req: NextRequest, { params }: Props) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        const visitor = await Visitor.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true }
        ).lean();

        if (!visitor) return apiError('Visitor not found', 404);
        return apiSuccess(visitor);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/visitors/[id] - delete visitor
export async function DELETE(req: NextRequest, { params }: Props) {
    try {
        await dbConnect();
        const { id } = await params;
        const visitor = await Visitor.findByIdAndDelete(id).lean();
        if (!visitor) return apiError('Visitor not found', 404);
        return apiSuccess({ message: 'Deleted successfully' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
