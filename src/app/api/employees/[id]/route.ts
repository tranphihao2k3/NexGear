import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Employee from '@/models/Employee';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

// GET /api/employees/[id]
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const employee = await Employee.findById(id).lean();
        if (!employee) return apiError('Employee not found', 404);

        return apiSuccess(employee);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/employees/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        // Ensure uniqueness constraints when updating
        if (body.employeeCode) {
            const checkCode = await Employee.findOne({ employeeCode: body.employeeCode, _id: { $ne: id } });
            if (checkCode) return apiError('Employee code already in use', 400);
        }

        if (body.email) {
            const checkEmail = await Employee.findOne({ email: body.email, _id: { $ne: id } });
            if (checkEmail) return apiError('Email already in use by another employee', 400);
        }

        const employee = await Employee.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        }).lean();

        if (!employee) return apiError('Employee not found', 404);
        return apiSuccess(employee);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/employees/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const employee = await Employee.findByIdAndDelete(id);
        if (!employee) return apiError('Employee not found', 404);
        return apiSuccess({ message: 'Employee deleted' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
