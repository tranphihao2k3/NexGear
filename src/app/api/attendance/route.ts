import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/attendance
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        if (searchParams.get('employee')) filter.employee = searchParams.get('employee');
        if (searchParams.get('status')) filter.status = searchParams.get('status');

        // Date range
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) (filter.date as Record<string, Date>).$gte = new Date(startDate);
            if (endDate) (filter.date as Record<string, Date>).$lte = new Date(endDate);
        }

        const dateParam = searchParams.get('date');
        if (dateParam) {
            const date = new Date(dateParam);
            date.setUTCHours(0, 0, 0, 0);

            const nextDate = new Date(date);
            nextDate.setUTCDate(nextDate.getUTCDate() + 1);

            filter.date = {
                $gte: date,
                $lt: nextDate
            };
        }

        const [attendances, total] = await Promise.all([
            Attendance.find(filter)
                .populate('employee', 'employeeCode firstName lastName profileImage department')
                .populate('createdBy', 'name email')
                .sort({ date: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Attendance.countDocuments(filter),
        ]);

        return apiPaginated(attendances, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/attendance
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.employee || !body.date) {
            return apiError('employee and date are required', 400);
        }

        // Normalize date to midnight UTC to ensure uniqueness per day
        const date = new Date(body.date);
        date.setUTCHours(0, 0, 0, 0);
        body.date = date;

        const existingRecord = await Attendance.findOne({
            employee: body.employee,
            date: date
        });

        if (existingRecord) {
            return apiError('Attendance record already exists for this employee on this date', 400);
        }

        const attendance = await Attendance.create(body);
        return apiSuccess(attendance, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
