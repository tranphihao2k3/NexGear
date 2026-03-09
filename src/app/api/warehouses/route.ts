import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Warehouse from '@/models/Warehouse';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/warehouses
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        if (searchParams.get('status')) {
            filter.status = searchParams.get('status');
        }

        if (searchParams.get('isDefault') === 'true') {
            filter.isDefault = true;
        } else if (searchParams.get('isDefault') === 'false') {
            filter.isDefault = false;
        }

        const search = searchParams.get('search') || searchParams.get('q');
        if (search) {
            filter.$or = [
                { warehouseCode: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } },
            ];
        }

        const [warehouses, total] = await Promise.all([
            Warehouse.find(filter)
                .populate('managerId', 'firstName lastName profileImage email phone')
                .sort({ isDefault: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Warehouse.countDocuments(filter),
        ]);

        return apiPaginated(warehouses, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/warehouses
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.warehouseCode || !body.name) {
            return apiError('warehouseCode and name are required', 400);
        }

        const existingCode = await Warehouse.findOne({ warehouseCode: body.warehouseCode });
        if (existingCode) return apiError('Warehouse code already exists', 400);

        // If this one is set as default, unset others first
        if (body.isDefault) {
            await Warehouse.updateMany({}, { isDefault: false });
        }

        const warehouse = await Warehouse.create(body);
        return apiSuccess(warehouse, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
