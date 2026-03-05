import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import InventoryLog from '@/models/InventoryLog';
import Product from '@/models/Product';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/inventory
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};
        if (searchParams.get('product')) filter.product = searchParams.get('product');
        if (searchParams.get('type')) filter.type = searchParams.get('type');

        const [logs, total] = await Promise.all([
            InventoryLog.find(filter)
                .populate('product', 'name sku images')
                .populate('supplier', 'name')
                .populate('createdBy', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            InventoryLog.countDocuments(filter),
        ]);

        return apiPaginated(logs, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/inventory — Create inventory log + update product stock
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.product || !body.type || body.quantity === undefined || !body.createdBy) {
            return apiError('product, type, quantity, and createdBy are required');
        }

        // Get current stock
        const product = await Product.findById(body.product);
        if (!product) return apiError('Product not found', 404);

        const stockBefore = product.stock;
        const quantityChange = ['import', 'return'].includes(body.type)
            ? Math.abs(body.quantity)
            : -Math.abs(body.quantity);
        const stockAfter = stockBefore + quantityChange;

        if (stockAfter < 0) {
            return apiError(`Insufficient stock. Current: ${stockBefore}, Requested: ${Math.abs(body.quantity)}`);
        }

        // Create log
        const log = await InventoryLog.create({
            ...body,
            quantity: quantityChange,
            stockBefore,
            stockAfter,
            totalCost: body.costPrice ? Math.abs(body.quantity) * body.costPrice : null,
        });

        // Update product stock
        product.stock = stockAfter;
        if (body.type === 'import' && body.costPrice) {
            product.costPrice = body.costPrice;
        }
        await product.save();

        return apiSuccess(log, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
