import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Inventory from '@/models/Inventory';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

// GET /api/inventories/[id]
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const inventory = await Inventory.findById(id)
            .populate('product', 'name sku price images stock')
            .populate('warehouse', 'name warehouseCode address')
            .lean();

        if (!inventory) return apiError('Inventory record not found', 404);

        return apiSuccess(inventory);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/inventories/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        // Ensure uniqueness constraints when updating
        if (body.product || body.warehouse) {
            const existingInventory = await Inventory.findById(id);
            if (!existingInventory) return apiError('Inventory record not found', 404);

            const targetProduct = body.product || existingInventory.product;
            const targetWarehouse = body.warehouse || existingInventory.warehouse;

            const checkUnique = await Inventory.findOne({
                product: targetProduct,
                warehouse: targetWarehouse,
                _id: { $ne: id }
            });

            if (checkUnique) return apiError('Another record already exists for this product in this warehouse', 400);
        }

        const inventory = await Inventory.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        }).lean();

        if (!inventory) return apiError('Inventory record not found', 404);
        return apiSuccess(inventory);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/inventories/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const inventory = await Inventory.findByIdAndDelete(id);
        if (!inventory) return apiError('Inventory record not found', 404);
        return apiSuccess({ message: 'Inventory record deleted' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
