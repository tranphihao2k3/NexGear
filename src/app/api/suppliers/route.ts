import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Supplier from '@/models/Supplier';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);
        const [suppliers, total] = await Promise.all([
            Supplier.find().sort({ name: 1 }).skip(skip).limit(limit).lean(),
            Supplier.countDocuments(),
        ]);
        return apiPaginated(suppliers, total, page, limit);
    } catch (error) { return apiError((error as Error).message, 500); }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        if (!body.name) return apiError('name is required');
        const supplier = await Supplier.create(body);
        return apiSuccess(supplier, 201);
    } catch (error) { return apiError((error as Error).message, 500); }
}
