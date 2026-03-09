import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PurchaseOrder from '@/models/PurchaseOrder';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/purchase-orders
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        if (searchParams.get('status')) filter.status = searchParams.get('status');
        if (searchParams.get('paymentStatus')) filter.paymentStatus = searchParams.get('paymentStatus');
        if (searchParams.get('supplier')) filter.supplier = searchParams.get('supplier');
        if (searchParams.get('warehouse')) filter.warehouse = searchParams.get('warehouse');

        const search = searchParams.get('search') || searchParams.get('q');
        if (search) {
            filter.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { supplierName: { $regex: search, $options: 'i' } },
            ];
        }

        const [orders, total] = await Promise.all([
            PurchaseOrder.find(filter)
                .populate('supplier', 'name status supplierCode contactPerson')
                .populate('warehouse', 'name warehouseCode')
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            PurchaseOrder.countDocuments(filter),
        ]);

        return apiPaginated(orders, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/purchase-orders
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.orderNumber || !body.supplier || !body.warehouse) {
            return apiError('orderNumber, supplier, and warehouse are required', 400);
        }

        const existingOrder = await PurchaseOrder.findOne({ orderNumber: body.orderNumber });
        if (existingOrder) return apiError('Purchase Order number already exists', 400);

        // Calculate item totals if missing
        if (body.items && Array.isArray(body.items)) {
            body.items = body.items.map((item: any) => ({
                ...item,
                totalPrice: item.quantity * (item.unitPrice || 0)
            }));
        }

        const order = await PurchaseOrder.create(body);
        return apiSuccess(order, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
