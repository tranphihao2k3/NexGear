import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Shipping from '@/models/Shipping';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

// GET /api/shippings/[id]
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const shipping = await Shipping.findById(id)
            .populate('order', 'orderNumber status customer customerType totalAmount')
            .lean();

        if (!shipping) return apiError('Shipping record not found', 404);

        return apiSuccess(shipping);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/shippings/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        // Ensure uniqueness when updating order
        if (body.order) {
            const checkOrder = await Shipping.findOne({
                order: body.order,
                _id: { $ne: id }
            });
            if (checkOrder) return apiError('Shipping record for this order already exists', 400);
        }

        const existing = await Shipping.findById(id);
        if (!existing) return apiError('Shipping record not found', 404);

        if (body.status === 'delivered' && existing.status !== 'delivered' && !body.deliveredDate) {
            body.deliveredDate = new Date();
        }
        if (['picked_up', 'in_transit', 'out_for_delivery'].includes(body.status) && existing.status === 'pending' && !body.shippedDate) {
            body.shippedDate = new Date();
        }

        const shipping = await Shipping.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        }).lean();

        return apiSuccess(shipping);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/shippings/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const existing = await Shipping.findById(id);
        if (!existing) return apiError('Shipping record not found', 404);

        if (['picked_up', 'in_transit', 'out_for_delivery', 'delivered'].includes(existing.status)) {
            return apiError('Cannot delete a shipping record that has been processed or delivered. Use cancel status instead.', 400);
        }

        await Shipping.findByIdAndDelete(id);

        return apiSuccess({ message: 'Shipping record deleted' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
