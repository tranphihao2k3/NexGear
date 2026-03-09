import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PurchaseOrder from '@/models/PurchaseOrder';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

// GET /api/purchase-orders/[id]
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const order = await PurchaseOrder.findById(id)
            .populate('supplier', 'name status supplierCode contactPerson email phone address')
            .populate('warehouse', 'name warehouseCode address')
            .populate('createdBy', 'name email')
            .lean();

        if (!order) return apiError('Purchase order not found', 404);

        return apiSuccess(order);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/purchase-orders/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        // Ensure orderNumber uniqueness when updating
        if (body.orderNumber) {
            const checkNumber = await PurchaseOrder.findOne({
                orderNumber: body.orderNumber,
                _id: { $ne: id }
            });
            if (checkNumber) return apiError('Purchase Order number already exists', 400);
        }

        // Recalculate totals if items are changed
        if (body.items && Array.isArray(body.items)) {
            body.items = body.items.map((item: any) => ({
                ...item,
                totalPrice: item.quantity * (item.unitPrice || 0)
            }));
        }

        const order = await PurchaseOrder.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        }).lean();

        if (!order) return apiError('Purchase order not found', 404);
        return apiSuccess(order);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/purchase-orders/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const existingOrder = await PurchaseOrder.findById(id);
        if (!existingOrder) return apiError('Purchase order not found', 404);

        // Only allow deleting drafts
        if (existingOrder.status !== 'draft' && existingOrder.status !== 'cancelled') {
            return apiError('Cannot delete orders that are not draft or cancelled', 400);
        }

        await PurchaseOrder.findByIdAndDelete(id);
        return apiSuccess({ message: 'Purchase order deleted' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
