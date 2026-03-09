import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AuditLog from '@/models/AuditLog';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/audit-logs
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        if (searchParams.get('collectionName')) filter.collectionName = searchParams.get('collectionName');
        if (searchParams.get('action')) filter.action = searchParams.get('action');
        if (searchParams.get('user')) filter.user = searchParams.get('user');

        // Date range
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) (filter.createdAt as Record<string, Date>).$gte = new Date(startDate);
            if (endDate) (filter.createdAt as Record<string, Date>).$lte = new Date(endDate);
        }

        const search = searchParams.get('search') || searchParams.get('q');
        if (search) {
            filter.description = { $regex: search, $options: 'i' };
        }

        const [logs, total] = await Promise.all([
            AuditLog.find(filter)
                .populate('user', 'name email role')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            AuditLog.countDocuments(filter),
        ]);

        return apiPaginated(logs, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
