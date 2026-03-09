import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Salary from '@/models/Salary';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/salaries
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        if (searchParams.get('employee')) filter.employee = searchParams.get('employee');
        if (searchParams.get('status')) filter.status = searchParams.get('status');
        if (searchParams.get('year')) filter.year = Number(searchParams.get('year'));
        if (searchParams.get('month')) filter.month = Number(searchParams.get('month'));

        const [salaries, total] = await Promise.all([
            Salary.find(filter)
                .populate('employee', 'name email role')
                .populate('createdBy', 'name email')
                .sort({ year: -1, month: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Salary.countDocuments(filter),
        ]);

        return apiPaginated(salaries, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/salaries
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.employee || !body.month || !body.year || body.baseSalary === undefined) {
            return apiError('employee, month, year, and baseSalary are required', 400);
        }

        const existingRecord = await Salary.findOne({
            employee: body.employee,
            month: body.month,
            year: body.year
        });

        if (existingRecord) {
            return apiError('Salary record already exists for this employee in this month/year', 400);
        }

        // Auto-calculate gross and net salary if not provided
        const base = Number(body.baseSalary) || 0;
        const allowances = Number(body.allowances) || 0;
        const bonuses = Number(body.bonuses) || 0;
        const deductions = Number(body.deductions) || 0;

        if (body.grossSalary === undefined) {
            body.grossSalary = base + allowances + bonuses;
        }

        if (body.netSalary === undefined) {
            body.netSalary = body.grossSalary - deductions;
        }

        if (body.status === 'paid' && !body.paidDate) {
            body.paidDate = new Date();
        }

        const salary = await Salary.create(body);
        return apiSuccess(salary, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
