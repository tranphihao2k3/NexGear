import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const coupon = await Coupon.findById(id).lean();
        if (!coupon) return apiError('Coupon not found', 404);
        return apiSuccess(coupon);
    } catch (error) { return apiError((error as Error).message, 500); }
}

export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();
        const coupon = await Coupon.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();
        if (!coupon) return apiError('Coupon not found', 404);
        return apiSuccess(coupon);
    } catch (error) { return apiError((error as Error).message, 500); }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const coupon = await Coupon.findByIdAndDelete(id);
        if (!coupon) return apiError('Coupon not found', 404);
        return apiSuccess({ message: 'Coupon deleted' });
    } catch (error) { return apiError((error as Error).message, 500); }
}
