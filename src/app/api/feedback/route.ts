import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Feedback from '@/models/Feedback';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/feedback
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        if (searchParams.get('type')) filter.type = searchParams.get('type');
        if (searchParams.get('status')) filter.status = searchParams.get('status');

        const search = searchParams.get('search') || searchParams.get('q');
        if (search) {
            filter.$or = [
                { customerName: { $regex: search, $options: 'i' } },
                { customerEmail: { $regex: search, $options: 'i' } },
                { customerPhone: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } },
            ];
        }

        const [feedbacks, total] = await Promise.all([
            Feedback.find(filter)
                .populate('repliedBy', 'name email')
                .populate('order', 'orderNumber status')
                .populate('product', 'name sku')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Feedback.countDocuments(filter),
        ]);

        return apiPaginated(feedbacks, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/feedback
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.customerName || !body.subject || !body.message) {
            return apiError('customerName, subject, and message are required', 400);
        }

        const feedback = await Feedback.create(body);
        return apiSuccess(feedback, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
