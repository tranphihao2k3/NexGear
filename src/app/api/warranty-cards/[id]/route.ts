import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import WarrantyCard from '@/models/WarrantyCard';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

// GET /api/warranty-cards/[id]
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const warrantyCard = await WarrantyCard.findById(id)
            .populate('product', 'name sku images warranty')
            .populate('customer', 'name phone email address')
            .populate('order', 'orderNumber status createdAt')
            .populate('productUnit', 'serialNumber barcode condition')
            .lean();

        if (!warrantyCard) return apiError('Warranty card not found', 404);

        return apiSuccess(warrantyCard);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/warranty-cards/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        // Ensure uniqueness when updating
        if (body.warrantyNumber) {
            const checkNumber = await WarrantyCard.findOne({
                warrantyNumber: body.warrantyNumber,
                _id: { $ne: id }
            });
            if (checkNumber) return apiError('Warranty Card number already exists', 400);
        }

        // Auto-calculate dates if needed
        if (body.warrantyStartDate || body.warrantyMonths) {
            const existing = await WarrantyCard.findById(id);
            if (existing) {
                const start = body.warrantyStartDate ? new Date(body.warrantyStartDate) : existing.warrantyStartDate;
                const months = body.warrantyMonths || existing.warrantyMonths;

                if (start) {
                    const endDate = new Date(start);
                    endDate.setMonth(endDate.getMonth() + Number(months));
                    body.warrantyEndDate = endDate;
                }
            }
        }

        const warrantyCard = await WarrantyCard.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        }).lean();

        if (!warrantyCard) return apiError('Warranty card not found', 404);
        return apiSuccess(warrantyCard);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/warranty-cards/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const warrantyCard = await WarrantyCard.findByIdAndDelete(id);
        if (!warrantyCard) return apiError('Warranty card not found', 404);

        return apiSuccess({ message: 'Warranty card deleted' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
