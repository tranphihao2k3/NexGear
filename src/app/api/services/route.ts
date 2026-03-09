import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Service from '@/models/Service';
import ServiceItem from '@/models/ServiceItem';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/services
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        if (searchParams.get('status')) filter.status = searchParams.get('status');
        if (searchParams.get('priority')) filter.priority = searchParams.get('priority');
        if (searchParams.get('serviceType')) filter.serviceType = searchParams.get('serviceType');
        if (searchParams.get('customer')) filter.customer = searchParams.get('customer');
        if (searchParams.get('technician')) filter.technician = searchParams.get('technician');

        const search = searchParams.get('search') || searchParams.get('q');
        if (search) {
            filter.$or = [
                { serviceNumber: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } },
                { customerPhone: { $regex: search, $options: 'i' } },
            ];
        }

        const [services, total] = await Promise.all([
            Service.find(filter)
                .populate('customer', 'name phone email loyaltyPoints')
                .populate('technician', 'firstName lastName profileImage')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Service.countDocuments(filter),
        ]);

        return apiPaginated(services, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/services
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.serviceNumber || !body.serviceType || !body.customerName || !body.customerPhone || !body.issueDescription) {
            return apiError('serviceNumber, serviceType, customerName, customerPhone, and issueDescription are required', 400);
        }

        const existingService = await Service.findOne({ serviceNumber: body.serviceNumber });
        if (existingService) return apiError('Service number already exists', 400);

        // Auto-set completed status if passed
        if (body.status === 'completed' && !body.completedDate) {
            body.completedDate = new Date();
        }

        const service = await Service.create(body);

        // If items are provided, create them
        if (body.items && Array.isArray(body.items)) {
            const itemsToCreate = body.items.map((item: any) => ({
                ...item,
                service: service._id
            }));
            await ServiceItem.insertMany(itemsToCreate);
        }

        return apiSuccess(service, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
