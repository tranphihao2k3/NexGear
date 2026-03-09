import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Return from '@/models/Return';
import ReturnItem from '@/models/ReturnItem';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

// GET /api/returns/[id]
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const returnRecord = await Return.findById(id)
            .populate('order', 'orderNumber status totalAmount createdAt')
            .populate('customer', 'name phone email address')
            .populate('processedBy', 'name email role')
            .lean();

        if (!returnRecord) return apiError('Return order not found', 404);

        // Fetch ReturnItems
        const items = await ReturnItem.find({ returnOrder: id })
            .populate('product', 'name sku price images')
            .populate('productUnit', 'sku condition batteryCycle')
            .lean();

        return apiSuccess({ ...returnRecord, items });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/returns/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        const { items, ...returnData } = body;

        const existingReturn = await Return.findById(id);
        if (!existingReturn) return apiError('Return order not found', 404);

        // Ensure returnNumber uniquely identifies the return
        if (returnData.returnNumber) {
            const checkNumber = await Return.findOne({
                returnNumber: returnData.returnNumber,
                _id: { $ne: id }
            });
            if (checkNumber) return apiError('Return number already exists', 400);
        }

        // Auto-handled: update status triggers (processedAt, processedBy handled by caller)
        if (returnData.status === 'processed' && existingReturn.status !== 'processed') {
            if (!returnData.processedAt) returnData.processedAt = new Date();
        }

        const returnRecord = await Return.findByIdAndUpdate(id, returnData, {
            new: true,
            runValidators: true,
        }).lean();

        // Update ReturnItems if provided
        if (items && Array.isArray(items)) {
            // Simple logic: delete existing and recreate. More complex would handle diffing.
            await ReturnItem.deleteMany({ returnOrder: id });

            if (items.length > 0) {
                const returnItemsData = items.map((item: any) => ({
                    ...item,
                    returnOrder: id
                }));
                await ReturnItem.insertMany(returnItemsData);
            }
        }

        const updatedItems = await ReturnItem.find({ returnOrder: id })
            .populate('product', 'name sku price images')
            .populate('productUnit', 'sku condition batteryCycle')
            .lean();

        return apiSuccess({ ...returnRecord, items: updatedItems });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/returns/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const existing = await Return.findById(id);
        if (!existing) return apiError('Return order not found', 404);

        if (['processed', 'approved', 'rejected'].includes(existing.status)) {
            return apiError('Cannot delete a return that is already processed or has moved from pending', 400);
        }

        await Promise.all([
            Return.findByIdAndDelete(id),
            ReturnItem.deleteMany({ returnOrder: id })
        ]);

        return apiSuccess({ message: 'Return order and items deleted' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
