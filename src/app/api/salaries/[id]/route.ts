import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Salary from '@/models/Salary';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

// GET /api/salaries/[id]
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const salary = await Salary.findById(id)
            .populate('employee', 'name email role')
            .populate('createdBy', 'name email')
            .lean();

        if (!salary) return apiError('Salary record not found', 404);

        return apiSuccess(salary);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/salaries/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        const existingSalary = await Salary.findById(id);
        if (!existingSalary) return apiError('Salary record not found', 404);

        // Ensure uniqueness constraints when updating
        if (body.employee || body.month || body.year) {
            const targetEmployee = body.employee || existingSalary.employee;
            const targetMonth = body.month || existingSalary.month;
            const targetYear = body.year || existingSalary.year;

            const checkUnique = await Salary.findOne({
                employee: targetEmployee,
                month: targetMonth,
                year: targetYear,
                _id: { $ne: id }
            });

            if (checkUnique) return apiError('Another record already exists for this employee in this month/year', 400);
        }

        // Auto-calculate if base, allowances, bonuses, or deductions are updated
        const base = body.baseSalary !== undefined ? Number(body.baseSalary) : existingSalary.baseSalary;
        const allowances = body.allowances !== undefined ? Number(body.allowances) : existingSalary.allowances;
        const bonuses = body.bonuses !== undefined ? Number(body.bonuses) : existingSalary.bonuses;
        const deductions = body.deductions !== undefined ? Number(body.deductions) : existingSalary.deductions;

        if (body.grossSalary === undefined) {
            body.grossSalary = base + allowances + bonuses;
        }

        if (body.netSalary === undefined) {
            body.netSalary = body.grossSalary - deductions;
        }

        // Handle paid Date
        if (body.status === 'paid' && existingSalary.status !== 'paid' && !body.paidDate) {
            body.paidDate = new Date();
        } else if (body.status && body.status !== 'paid' && existingSalary.status === 'paid') {
            body.paidDate = null;
        }

        const salary = await Salary.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        }).lean();

        return apiSuccess(salary);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/salaries/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const existing = await Salary.findById(id);
        if (!existing) return apiError('Salary record not found', 404);

        if (existing.status === 'paid') {
            return apiError('Cannot delete a paid salary record', 400);
        }

        await Salary.findByIdAndDelete(id);

        return apiSuccess({ message: 'Salary record deleted' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
