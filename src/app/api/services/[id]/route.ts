import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Service from '@/models/Service';
import ServiceItem from '@/models/ServiceItem';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

// GET /api/services/[id]
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const service = await Service.findById(id)
            .populate('customer', 'name phone email loyaltyPoints address')
            .populate('technician', 'firstName lastName profileImage department')
            .lean();

        if (!service) return apiError('Service not found', 404);

        // Fetch service items
        const items = await ServiceItem.find({ service: id }).lean();

        return apiSuccess({ ...service, items });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/services/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        if (body.serviceNumber) {
            const checkNumber = await Service.findOne({
                serviceNumber: body.serviceNumber,
                _id: { $ne: id }
            });
            if (checkNumber) return apiError('Service number already exists', 400);
        }

        const existingService = await Service.findById(id);
        if (!existingService) return apiError('Service not found', 404);

        if (body.status === 'completed' && existingService.status !== 'completed' && !body.completedDate) {
            body.completedDate = new Date();
        }

        const service = await Service.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        }).lean();

        // Update items if provided in body array
        if (body.items && Array.isArray(body.items)) {
            // Very simple approach: clear old items, insert new items
            // A robust API might handle partial updates by ID
            await ServiceItem.deleteMany({ service: id });

            const itemsToCreate = body.items.map((item: any) => ({
                ...item,
                service: id
            }));
            await ServiceItem.insertMany(itemsToCreate);
        }

        const updatedItems = await ServiceItem.find({ service: id }).lean();
        return apiSuccess({ ...service, items: updatedItems });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/services/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const service = await Service.findByIdAndDelete(id);
        if (!service) return apiError('Service not found', 404);

        // Also delete associated service items
        await ServiceItem.deleteMany({ service: id });

        return apiSuccess({ message: 'Service and its items deleted' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
