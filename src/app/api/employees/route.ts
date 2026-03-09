import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Employee from '@/models/Employee';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/employees
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        if (searchParams.get('status')) {
            filter.status = searchParams.get('status');
        }

        if (searchParams.get('position')) {
            filter.position = searchParams.get('position');
        }

        if (searchParams.get('department')) {
            filter.department = searchParams.get('department');
        }

        const search = searchParams.get('search') || searchParams.get('q');
        if (search) {
            filter.$or = [
                { employeeCode: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
            ];
        }

        const [employees, total] = await Promise.all([
            Employee.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Employee.countDocuments(filter),
        ]);

        return apiPaginated(employees, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/employees
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.employeeCode || !body.firstName || !body.lastName || !body.phone) {
            return apiError('employeeCode, firstName, lastName and phone are required', 400);
        }

        const existingCode = await Employee.findOne({ employeeCode: body.employeeCode });
        if (existingCode) return apiError('Employee code already exists', 400);

        if (body.email) {
            const existingEmail = await Employee.findOne({ email: body.email });
            if (existingEmail) return apiError('Employee email already exists', 400);
        }

        const employee = await Employee.create(body);
        return apiSuccess(employee, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
