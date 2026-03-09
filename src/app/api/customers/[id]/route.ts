import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Customer from '@/models/Customer';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

// GET /api/customers/[id]
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const customer = await Customer.findById(id).populate('orders').lean();
        if (!customer) return apiError('Customer not found', 404);

        return apiSuccess(customer);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/customers/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        // Ensure uniqueness constraints when updating
        if (body.phone) {
            const checkPhone = await Customer.findOne({ phone: body.phone, _id: { $ne: id } });
            if (checkPhone) return apiError('Phone number already in use by another customer', 400);
        }

        if (body.email) {
            const checkEmail = await Customer.findOne({ email: body.email, _id: { $ne: id } });
            if (checkEmail) return apiError('Email already in use by another customer', 400);
        }

        const customer = await Customer.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        }).lean();

        if (!customer) return apiError('Customer not found', 404);
        return apiSuccess(customer);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/customers/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const customer = await Customer.findByIdAndDelete(id);
        if (!customer) return apiError('Customer not found', 404);
        return apiSuccess({ message: 'Customer deleted' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
