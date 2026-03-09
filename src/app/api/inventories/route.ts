import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Inventory from '@/models/Inventory';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/inventories
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        if (searchParams.get('product')) {
            filter.product = searchParams.get('product');
        }

        if (searchParams.get('warehouse')) {
            filter.warehouse = searchParams.get('warehouse');
        }

        if (searchParams.get('lowStock') === 'true') {
            filter.$expr = { $lte: ['$availableQuantity', '$minStock'] };
        }

        const [inventories, total] = await Promise.all([
            Inventory.find(filter)
                .populate('product', 'name sku price images stock')
                .populate('warehouse', 'name warehouseCode')
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Inventory.countDocuments(filter),
        ]);

        return apiPaginated(inventories, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/inventories
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.product || !body.warehouse) {
            return apiError('product and warehouse are required', 400);
        }

        const existingRecord = await Inventory.findOne({
            product: body.product,
            warehouse: body.warehouse
        });

        if (existingRecord) {
            return apiError('Inventory record already exists for this product in this warehouse', 400);
        }

        const inventory = await Inventory.create(body);
        return apiSuccess(inventory, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
