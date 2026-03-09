import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ProductHistory from '@/models/ProductHistory';
import { apiSuccess, apiError } from '@/lib/api-helpers';

// GET /api/product-history/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id;
        await dbConnect();
        const history = await ProductHistory.findById(id)
            .populate({
                path: 'productUnit',
                select: 'sku serialNumber condition batteryCycleCount',
                populate: { path: 'product', select: 'name sku model' }
            })
            .populate('performedBy', 'name email')
            .lean();

        if (!history) {
            return apiError('Không tìm thấy bản ghi', 404);
        }

        return apiSuccess(history);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/product-history/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id;
        await dbConnect();
        const body = await req.json();

        if (!body.productUnit || !body.eventType || !body.description) {
            return apiError('productUnit, eventType, and description are required', 400);
        }

        const history = await ProductHistory.findByIdAndUpdate(
            id,
            {
                productUnit: body.productUnit,
                eventType: body.eventType,
                eventDate: body.eventDate || new Date(),
                description: body.description,
                relatedType: body.relatedType || null,
                relatedId: body.relatedId || null,
            },
            { new: true, runValidators: true }
        ).lean();

        if (!history) {
            return apiError('Không tìm thấy bản ghi', 404);
        }

        return apiSuccess(history);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/product-history/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id;
        await dbConnect();
        const history = await ProductHistory.findByIdAndDelete(id).lean();

        if (!history) {
            return apiError('Không tìm thấy bản ghi', 404);
        }

        return apiSuccess({ deleted: true });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
