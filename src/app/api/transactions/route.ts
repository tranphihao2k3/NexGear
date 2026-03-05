import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/transactions
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};
        if (searchParams.get('type')) filter.type = searchParams.get('type');
        if (searchParams.get('category')) filter.category = searchParams.get('category');
        if (searchParams.get('direction')) filter.direction = searchParams.get('direction');

        const from = searchParams.get('from');
        const to = searchParams.get('to');
        if (from || to) {
            filter.date = {};
            if (from) (filter.date as Record<string, Date>).$gte = new Date(from);
            if (to) (filter.date as Record<string, Date>).$lte = new Date(to);
        }

        const [transactions, total] = await Promise.all([
            Transaction.find(filter)
                .populate('orderId', 'orderCode')
                .populate('createdBy', 'name')
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Transaction.countDocuments(filter),
        ]);

        return apiPaginated(transactions, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/transactions
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.type || !body.category || !body.amount || !body.direction || !body.description || !body.date || !body.createdBy) {
            return apiError('type, category, amount, direction, description, date, and createdBy are required');
        }

        const transaction = await Transaction.create(body);
        return apiSuccess(transaction, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
