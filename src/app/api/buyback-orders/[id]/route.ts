import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BuybackOrder from '@/models/BuybackOrder';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

// GET /api/buyback-orders/[id]
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const buyback = await BuybackOrder.findById(id)
            .populate('inspectedBy', 'name email')
            .populate('approvedBy', 'name email')
            .populate('voucher', 'code discountValue discountType validationRules minOrderValue maxDiscount')
            .lean();

        if (!buyback) return apiError('Buyback order not found', 404);

        return apiSuccess(buyback);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/buyback-orders/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        // Ensure uniqueness when updating order number
        if (body.buybackNumber) {
            const checkNumber = await BuybackOrder.findOne({
                buybackNumber: body.buybackNumber,
                _id: { $ne: id }
            });
            if (checkNumber) return apiError('Buyback Order number already exists', 400);
        }

        const existing = await BuybackOrder.findById(id);
        if (!existing) return apiError('Buyback order not found', 404);

        // Auto track changes in status
        if (body.status) {
            if (body.status === 'inspecting' && existing.status !== 'inspecting' && !body.inspectedAt) {
                body.inspectedAt = new Date();
            }
            if ((body.status === 'approved' || body.status === 'rejected') && existing.status !== body.status && !body.approvedAt) {
                body.approvedAt = new Date();
            }
        }

        const buyback = await BuybackOrder.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        }).lean();

        return apiSuccess(buyback);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/buyback-orders/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const existing = await BuybackOrder.findById(id);
        if (!existing) return apiError('Buyback order not found', 404);

        if (existing.status !== 'pending' && existing.status !== 'cancelled') {
            return apiError('Cannot delete buyback order unless it is pending or cancelled', 400);
        }

        await BuybackOrder.findByIdAndDelete(id);

        return apiSuccess({ message: 'Buyback order deleted' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
