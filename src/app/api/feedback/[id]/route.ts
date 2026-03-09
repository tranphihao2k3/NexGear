import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Feedback from '@/models/Feedback';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

// GET /api/feedback/[id]
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const feedback = await Feedback.findById(id)
            .populate('repliedBy', 'name email')
            .populate('order', 'orderNumber status')
            .populate('product', 'name sku price')
            .lean();

        if (!feedback) return apiError('Feedback not found', 404);

        return apiSuccess(feedback);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/feedback/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        const existing = await Feedback.findById(id);
        if (!existing) return apiError('Feedback not found', 404);

        if (body.reply && !existing.reply) {
            body.repliedAt = new Date();
            if (body.status === 'new' || body.status === 'pending') {
                body.status = 'replied';
            }
        }

        const feedback = await Feedback.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        }).lean();

        return apiSuccess(feedback);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/feedback/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const feedback = await Feedback.findByIdAndDelete(id);
        if (!feedback) return apiError('Feedback not found', 404);

        return apiSuccess({ message: 'Feedback deleted' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
