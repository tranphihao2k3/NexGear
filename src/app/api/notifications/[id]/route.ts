import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

// GET /api/notifications/[id]
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const notification = await Notification.findById(id)
            .populate('user', 'name email role')
            .lean();

        if (!notification) return apiError('Notification not found', 404);

        return apiSuccess(notification);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/notifications/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        // Used primarily to mark as read/unread
        if (body.isRead && !body.readAt) {
            body.readAt = new Date();
        } else if (body.isRead === false) {
            body.readAt = null;
        }

        const notification = await Notification.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        }).lean();

        if (!notification) return apiError('Notification not found', 404);
        return apiSuccess(notification);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/notifications/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const notification = await Notification.findByIdAndDelete(id);
        if (!notification) return apiError('Notification not found', 404);

        return apiSuccess({ message: 'Notification deleted' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
