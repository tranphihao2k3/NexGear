import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Return from '@/models/Return';
import ReturnItem from '@/models/ReturnItem';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/returns
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        if (searchParams.get('order')) filter.order = searchParams.get('order');
        if (searchParams.get('customer')) filter.customer = searchParams.get('customer');
        if (searchParams.get('status')) filter.status = searchParams.get('status');
        if (searchParams.get('returnType')) filter.returnType = searchParams.get('returnType');

        const search = searchParams.get('search') || searchParams.get('q');
        if (search) {
            filter.returnNumber = { $regex: search, $options: 'i' };
        }

        const [returns, total] = await Promise.all([
            Return.find(filter)
                .populate('order', 'orderNumber status totalAmount createdAt')
                .populate('customer', 'name phone email')
                .populate('processedBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Return.countDocuments(filter),
        ]);

        return apiPaginated(returns, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/returns
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        // Required fields for Return
        const { items, ...returnData } = body;

        if (!returnData.returnNumber || !returnData.order || !returnData.customer || !returnData.returnType || !returnData.reason) {
            return apiError('Missing required fields', 400);
        }

        const existingReturn = await Return.findOne({ returnNumber: returnData.returnNumber });
        if (existingReturn) return apiError('Return number already exists', 400);

        // Start transaction if possible, but for simplicity we'll create the Return first
        const newReturn = await Return.create(returnData);

        // Create ReturnItems if provided
        if (items && Array.isArray(items) && items.length > 0) {
            const returnItemsData = items.map((item: any) => ({
                ...item,
                returnOrder: newReturn._id
            }));
            await ReturnItem.insertMany(returnItemsData);
        }

        return apiSuccess(newReturn, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
