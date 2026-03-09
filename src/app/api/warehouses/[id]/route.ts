import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Warehouse from '@/models/Warehouse';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

// GET /api/warehouses/[id]
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const warehouse = await Warehouse.findById(id).populate('managerId', 'firstName lastName profileImage email phone').lean();
        if (!warehouse) return apiError('Warehouse not found', 404);

        return apiSuccess(warehouse);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/warehouses/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        if (body.warehouseCode) {
            const checkCode = await Warehouse.findOne({ warehouseCode: body.warehouseCode, _id: { $ne: id } });
            if (checkCode) return apiError('Warehouse code already in use', 400);
        }

        if (body.isDefault) {
            await Warehouse.updateMany({ _id: { $ne: id } }, { isDefault: false });
        }

        const warehouse = await Warehouse.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        }).lean();

        if (!warehouse) return apiError('Warehouse not found', 404);
        return apiSuccess(warehouse);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/warehouses/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        // Ensure default warehouse isn't deleted unless it's not default anymore
        const existing = await Warehouse.findById(id);
        if (existing?.isDefault) {
            return apiError('Cannot delete the default warehouse', 400);
        }

        const warehouse = await Warehouse.findByIdAndDelete(id);
        if (!warehouse) return apiError('Warehouse not found', 404);
        return apiSuccess({ message: 'Warehouse deleted' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
