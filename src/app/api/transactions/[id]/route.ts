import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const txn = await Transaction.findById(id)
            .populate('orderId', 'orderCode')
            .populate('createdBy', 'name')
            .lean();
        if (!txn) return apiError('Transaction not found', 404);
        return apiSuccess(txn);
    } catch (error) { return apiError((error as Error).message, 500); }
}

export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();
        const txn = await Transaction.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();
        if (!txn) return apiError('Transaction not found', 404);
        return apiSuccess(txn);
    } catch (error) { return apiError((error as Error).message, 500); }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const txn = await Transaction.findByIdAndDelete(id);
        if (!txn) return apiError('Transaction not found', 404);
        return apiSuccess({ message: 'Transaction deleted' });
    } catch (error) { return apiError((error as Error).message, 500); }
}
