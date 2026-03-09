import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FAQ from '@/models/FAQ';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

// GET /api/faqs/[id]
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const faq = await FAQ.findById(id).lean();
        if (!faq) return apiError('FAQ not found', 404);

        return apiSuccess(faq);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/faqs/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        const faq = await FAQ.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        }).lean();

        if (!faq) return apiError('FAQ not found', 404);
        return apiSuccess(faq);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/faqs/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const faq = await FAQ.findByIdAndDelete(id);
        if (!faq) return apiError('FAQ not found', 404);

        return apiSuccess({ message: 'FAQ deleted' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
