import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/notifications
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        if (searchParams.get('user')) filter.user = searchParams.get('user');
        if (searchParams.get('type')) filter.type = searchParams.get('type');
        if (searchParams.get('priority')) filter.priority = searchParams.get('priority');

        if (searchParams.get('isRead') === 'true') {
            filter.isRead = true;
        } else if (searchParams.get('isRead') === 'false') {
            filter.isRead = false;
        }

        const [notifications, total] = await Promise.all([
            Notification.find(filter)
                .populate('user', 'name email role')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments(filter),
        ]);

        return apiPaginated(notifications, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/notifications
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.type || !body.title || !body.message) {
            return apiError('type, title, and message are required', 400);
        }

        // If 'users' array is provided, create a notification for each
        if (body.users && Array.isArray(body.users) && body.users.length > 0) {
            const notifications = body.users.map((userId: string) => ({
                ...body,
                user: userId
            }));
            const created = await Notification.insertMany(notifications);
            return apiSuccess(created, 201);
        }

        // Create a single notification
        const notification = await Notification.create(body);
        return apiSuccess(notification, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
