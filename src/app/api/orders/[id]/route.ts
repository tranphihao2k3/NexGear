import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

// GET /api/orders/[id] — accepts ObjectId or orderCode
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const isObjectId = /^[a-f\d]{24}$/i.test(id);
        const order = isObjectId
            ? await Order.findById(id)
                .populate('user', 'name email phone')
                .populate('items.product', 'name slug images')
                .populate('coupon', 'code type value')
                .lean()
            : await Order.findOne({ orderCode: id })
                .populate('user', 'name email phone')
                .populate('items.product', 'name slug images')
                .populate('coupon', 'code type value')
                .lean();

        if (!order) return apiError('Order not found', 404);
        return apiSuccess(order);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/orders/[id] — Update status + add timeline entry
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        const order = await Order.findById(id);
        if (!order) return apiError('Order not found', 404);

        // If status is changing, push to timeline
        if (body.status && body.status !== order.status) {
            order.timeline.push({
                status: body.status,
                note: body.note || '',
                updatedBy: body.updatedBy,
                updatedAt: new Date(),
            });
            order.status = body.status;
        }

        // Update payment info
        if (body.payment) {
            Object.assign(order.payment, body.payment);
        }

        // Update shipping info
        if (body.shipping) {
            Object.assign(order.shipping, body.shipping);
        }

        // Update notes
        if (body.staffNotes !== undefined) order.staffNotes = body.staffNotes;

        await order.save();

        return apiSuccess(order);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
