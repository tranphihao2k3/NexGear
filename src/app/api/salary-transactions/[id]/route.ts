import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SalaryTransaction from '@/models/SalaryTransaction';
import User from '@/models/User';
import { apiSuccess, apiError } from '@/lib/api-helpers';

// PUT /api/salary-transactions/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        const tx = await SalaryTransaction.findByIdAndUpdate(
            id,
            {
                type: body.type,
                amount: Number(body.amount),
                label: body.label?.trim(),
                date: body.date ? new Date(body.date) : undefined,
                employee: body.employee,
                isAddition: body.isAddition,
            },
            { new: true }
        ).populate('employee', 'name role image baseSalary leaveQuota');

        if (!tx) return apiError('Transaction not found', 404);
        return apiSuccess(tx);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/salary-transactions/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        await SalaryTransaction.findByIdAndDelete(id);
        return apiSuccess({ deleted: id });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
