import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import User from '@/models/User';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

// GET /api/attendance/[id]
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const attendance = await Attendance.findById(id)
            .populate('employee', 'name image role')
            .lean();

        if (!attendance) return apiError('Attendance record not found', 404);

        return apiSuccess(attendance);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/attendance/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        // Ensure uniqueness constraints when updating
        if (body.employee || body.date) {
            const existingAttendance = await Attendance.findById(id);
            if (!existingAttendance) return apiError('Attendance record not found', 404);

            const targetEmployee = body.employee || existingAttendance.employee;
            let targetDate = existingAttendance.date;

            if (body.date) {
                targetDate = new Date(body.date);
                targetDate.setUTCHours(0, 0, 0, 0);
                body.date = targetDate; // Normalize for update
            }

            const checkUnique = await Attendance.findOne({
                employee: targetEmployee,
                date: targetDate,
                _id: { $ne: id }
            });

            if (checkUnique) return apiError('Another record already exists for this employee on this date', 400);
        }

        const attendance = await Attendance.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        }).lean();

        if (!attendance) return apiError('Attendance record not found', 404);
        return apiSuccess(attendance);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/attendance/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const attendance = await Attendance.findByIdAndDelete(id);
        if (!attendance) return apiError('Attendance record not found', 404);

        return apiSuccess({ message: 'Attendance record deleted' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
