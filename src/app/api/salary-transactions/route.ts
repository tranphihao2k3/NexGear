import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SalaryTransaction from '@/models/SalaryTransaction';
import User from '@/models/User';
import { apiSuccess, apiError } from '@/lib/api-helpers';

// GET /api/salary-transactions?month=3&year=2026&employeeId=xxx
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);

        const filter: Record<string, unknown> = {};

        const month = searchParams.get('month');
        const year = searchParams.get('year');
        const employeeId = searchParams.get('employeeId');

        if (month) filter.month = Number(month);
        if (year) filter.year = Number(year);
        if (employeeId) filter.employee = employeeId;

        const transactions = await SalaryTransaction.find(filter)
            .populate('employee', 'name role image baseSalary leaveQuota')
            .sort({ date: -1, createdAt: -1 })
            .lean();

        return apiSuccess(transactions);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/salary-transactions
// Body: { employeeId, type, amount, label, date?, month, year }
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.employee || !body.type || !body.amount || !body.label) {
            return apiError('employee, type, amount, label are required', 400);
        }

        const now = new Date(body.date || Date.now());
        const month = body.month || now.getMonth() + 1;
        const year = body.year || now.getFullYear();

        const tx = await SalaryTransaction.create({
            employee: body.employee,
            type: body.type,
            amount: Number(body.amount),
            label: body.label.trim(),
            date: now,
            month,
            year,
            isAddition: body.isAddition ?? (body.type === 'bonus'),
            createdBy: body.createdBy || null,
        });

        const populated = await tx.populate('employee', 'name role image baseSalary leaveQuota');
        return apiSuccess(populated, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/salary-transactions?ids=id1,id2  (xóa nhiều)
export async function DELETE(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const ids = searchParams.get('ids')?.split(',').filter(Boolean) || [];

        if (ids.length === 0) return apiError('ids required', 400);

        await SalaryTransaction.deleteMany({ _id: { $in: ids } });
        return apiSuccess({ deleted: ids.length });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
