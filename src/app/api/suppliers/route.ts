import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Supplier from '@/models/Supplier';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/suppliers
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        if (searchParams.get('isActive') === 'true') {
            filter.isActive = true;
        } else if (searchParams.get('isActive') === 'false') {
            filter.isActive = false;
        }

        const search = searchParams.get('search') || searchParams.get('q');
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { supplierCode: { $regex: search, $options: 'i' } },
                { contactPerson: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
            ];
        }

        const [suppliers, total] = await Promise.all([
            Supplier.find(filter)
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Supplier.countDocuments(filter),
        ]);

        return apiPaginated(suppliers, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/suppliers
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.name) {
            return apiError('Supplier name is required', 400);
        }

        const supplier = await Supplier.create(body);
        return apiSuccess(supplier, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
