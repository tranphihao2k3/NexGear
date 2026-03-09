import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Debt from '@/models/Debt';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

// GET /api/debts/[id]
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const debt = await Debt.findById(id)
            .populate('customer', 'name phone email address loyaltyPoints customerType')
            .populate('supplier', 'name status supplierCode contactPerson')
            .populate('order', 'orderNumber status subtotal totalAmount createdAt')
            .populate('purchaseOrder', 'orderNumber status subtotal totalAmount createdAt')
            .populate('createdBy', 'name email role')
            .lean();

        if (!debt) return apiError('Debt record not found', 404);

        return apiSuccess(debt);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/debts/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        const existing = await Debt.findById(id);
        if (!existing) return apiError('Debt record not found', 404);

        // Cannot change type of debt after creation
        if (body.debtType && body.debtType !== existing.debtType) {
            return apiError('Cannot change the type of debt', 400);
        }

        // We use save() to trigger the pre-save hook for status updates
        const debt = await Debt.findById(id);
        if (!debt) return apiError('Debt record not found', 404);

        for (const [key, value] of Object.entries(body)) {
            (debt as any)[key] = value;
        }

        await debt.save();

        return apiSuccess(debt);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/debts/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const debt = await Debt.findById(id);
        if (!debt) return apiError('Debt record not found', 404);

        if (debt.paidAmount > 0 && debt.status !== 'cancelled') {
            return apiError('Cannot delete a debt with partial or full payment unless it is cancelled', 400);
        }

        await Debt.findByIdAndDelete(id);
        return apiSuccess({ message: 'Debt record deleted' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
