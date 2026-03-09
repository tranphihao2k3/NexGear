import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Promotion from '@/models/Promotion';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

// GET /api/promotions/[id]
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const promotion = await Promotion.findById(id)
            .populate('applicableProducts', 'name sku price images status category')
            .populate('applicableCategories', 'name slug image')
            .lean();

        if (!promotion) return apiError('Promotion not found', 404);

        return apiSuccess(promotion);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/promotions/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        // Ensure uniqueness when updating code
        if (body.code) {
            const checkCode = await Promotion.findOne({
                code: body.code,
                _id: { $ne: id }
            });
            if (checkCode) return apiError('Promotion code already exists', 400);
        }

        const promotion = await Promotion.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        }).lean();

        if (!promotion) return apiError('Promotion not found', 404);
        return apiSuccess(promotion);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/promotions/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const existing = await Promotion.findById(id);
        if (!existing) return apiError('Promotion not found', 404);

        if (existing.usedCount > 0) {
            return apiError('Cannot delete a promotion that has been used', 400);
        }

        await Promotion.findByIdAndDelete(id);

        return apiSuccess({ message: 'Promotion deleted' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
