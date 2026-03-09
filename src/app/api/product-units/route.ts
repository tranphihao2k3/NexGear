import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ProductUnit from '@/models/ProductUnit';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/product-units
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        if (searchParams.get('product')) filter.product = searchParams.get('product');
        if (searchParams.get('status')) filter.status = searchParams.get('status');
        if (searchParams.get('condition')) filter.condition = searchParams.get('condition');
        if (searchParams.get('warehouse')) filter.warehouse = searchParams.get('warehouse');
        if (searchParams.get('source')) filter.source = searchParams.get('source');

        const search = searchParams.get('search') || searchParams.get('q');
        if (search) {
            filter.$or = [
                { serialNumber: { $regex: search, $options: 'i' } },
                { barcode: { $regex: search, $options: 'i' } },
            ];
        }

        const [productUnits, total] = await Promise.all([
            ProductUnit.find(filter)
                .populate('product', 'name sku model brand category')
                .populate('warehouse', 'name warehouseCode')
                .populate('supplier', 'name status supplierCode')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ProductUnit.countDocuments(filter),
        ]);

        return apiPaginated(productUnits, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/product-units
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.product || !body.serialNumber) {
            return apiError('product and serialNumber are required', 400);
        }

        const existingSerial = await ProductUnit.findOne({ serialNumber: body.serialNumber });
        if (existingSerial) {
            return apiError('serialNumber must be unique', 400);
        }

        if (body.barcode) {
            const existingBarcode = await ProductUnit.findOne({ barcode: body.barcode });
            if (existingBarcode) {
                return apiError('barcode must be unique', 400);
            }
        }

        const productUnit = await ProductUnit.create(body);
        return apiSuccess(productUnit, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
