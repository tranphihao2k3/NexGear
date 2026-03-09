import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ProductUnit from '@/models/ProductUnit';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

// GET /api/product-units/[id]
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const productUnit = await ProductUnit.findById(id)
            .populate('product', 'name sku model brand category')
            .populate('warehouse', 'name warehouseCode')
            .populate('supplier', 'name status supplierCode')
            .lean();

        if (!productUnit) return apiError('Product unit not found', 404);

        return apiSuccess(productUnit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/product-units/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        // Ensure uniqueness constraints when updating
        if (body.serialNumber) {
            const checkSerial = await ProductUnit.findOne({
                serialNumber: body.serialNumber,
                _id: { $ne: id }
            });
            if (checkSerial) return apiError('serialNumber already in use', 400);
        }

        if (body.barcode) {
            const checkBarcode = await ProductUnit.findOne({
                barcode: body.barcode,
                _id: { $ne: id }
            });
            if (checkBarcode) return apiError('barcode already in use', 400);
        }

        const productUnit = await ProductUnit.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        }).lean();

        if (!productUnit) return apiError('Product unit not found', 404);
        return apiSuccess(productUnit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/product-units/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const productUnit = await ProductUnit.findByIdAndDelete(id);
        if (!productUnit) return apiError('Product unit not found', 404);
        return apiSuccess({ message: 'Product unit deleted' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
