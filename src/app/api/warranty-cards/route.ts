import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import WarrantyCard from '@/models/WarrantyCard';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/warranty-cards
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        if (searchParams.get('status')) filter.status = searchParams.get('status');
        if (searchParams.get('customer')) filter.customer = searchParams.get('customer');
        if (searchParams.get('product')) filter.product = searchParams.get('product');

        const search = searchParams.get('search') || searchParams.get('q');
        if (search) {
            filter.$or = [
                { warrantyNumber: { $regex: search, $options: 'i' } },
                { serialNumber: { $regex: search, $options: 'i' } },
            ];
        }

        const [warrantyCards, total] = await Promise.all([
            WarrantyCard.find(filter)
                .populate('product', 'name sku images')
                .populate('customer', 'name phone email')
                .populate('order', 'orderNumber status')
                .populate('productUnit', 'serialNumber condition')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            WarrantyCard.countDocuments(filter),
        ]);

        return apiPaginated(warrantyCards, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/warranty-cards
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.warrantyNumber || !body.product || !body.customer) {
            return apiError('warrantyNumber, product, and customer are required', 400);
        }

        const existingCard = await WarrantyCard.findOne({ warrantyNumber: body.warrantyNumber });
        if (existingCard) return apiError('Warranty Card number already exists', 400);

        // Auto-calculate dates if not provided
        if (body.purchaseDate && body.warrantyMonths && !body.warrantyStartDate) {
            body.warrantyStartDate = body.purchaseDate;
        }
        
        if (body.warrantyStartDate && body.warrantyMonths && !body.warrantyEndDate) {
            const endDate = new Date(body.warrantyStartDate);
            endDate.setMonth(endDate.getMonth() + Number(body.warrantyMonths));
            body.warrantyEndDate = endDate;
        }

        const warrantyCard = await WarrantyCard.create(body);
        return apiSuccess(warrantyCard, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
