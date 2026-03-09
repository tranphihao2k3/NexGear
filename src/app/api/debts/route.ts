import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Debt from '@/models/Debt';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/debts
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        if (searchParams.get('debtType')) filter.debtType = searchParams.get('debtType');
        if (searchParams.get('status')) filter.status = searchParams.get('status');
        if (searchParams.get('customer')) filter.customer = searchParams.get('customer');
        if (searchParams.get('supplier')) filter.supplier = searchParams.get('supplier');

        const search = searchParams.get('search') || searchParams.get('q');
        if (search) {
            filter.description = { $regex: search, $options: 'i' };
        }

        const [debts, total] = await Promise.all([
            Debt.find(filter)
                .populate('customer', 'name phone email')
                .populate('supplier', 'name contactPerson supplierCode')
                .populate('order', 'orderNumber status createdAt')
                .populate('purchaseOrder', 'orderNumber status createdAt')
                .populate('createdBy', 'name email')
                .sort({ dueDate: 1, createdAt: -1 }) // Nearest due date first
                .skip(skip)
                .limit(limit)
                .lean(),
            Debt.countDocuments(filter),
        ]);

        return apiPaginated(debts, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/debts
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.debtType || body.totalAmount === undefined) {
            return apiError('debtType and totalAmount are required', 400);
        }

        if (body.debtType === 'customer' && !body.customer) {
            return apiError('customer is required for customer debt', 400);
        }

        if (body.debtType === 'supplier' && !body.supplier) {
            return apiError('supplier is required for supplier debt', 400);
        }

        // Sub-logic is handled by mongoose pre-'save' hook for status and remainingAmount
        const debt = await Debt.create(body);
        return apiSuccess(debt, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
