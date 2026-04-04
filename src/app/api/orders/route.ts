import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';
import { pusherServer } from '@/lib/pusher-server';

// GET /api/orders
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};
        if (searchParams.get('status')) filter.status = searchParams.get('status');
        if (searchParams.get('channel')) filter.channel = searchParams.get('channel');
        if (searchParams.get('user')) filter.user = searchParams.get('user');

        const search = searchParams.get('q');
        if (search) {
            filter.$or = [
                { orderCode: { $regex: search, $options: 'i' } },
                { 'customerInfo.name': { $regex: search, $options: 'i' } },
                { 'customerInfo.phone': { $regex: search, $options: 'i' } },
            ];
        }

        // Date range
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        if (from || to) {
            filter.createdAt = {};
            if (from) (filter.createdAt as Record<string, Date>).$gte = new Date(from);
            if (to) (filter.createdAt as Record<string, Date>).$lte = new Date(to);
        }

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .populate('user', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments(filter),
        ]);

        return apiPaginated(orders, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/orders — Create order
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.items || body.items.length === 0) {
            return apiError('Order must have at least one item');
        }

        // Auto-generate order code
        const lastOrder = await Order.findOne().sort({ createdAt: -1 }).select('orderCode');
        let nextNum = 1;
        if (lastOrder?.orderCode) {
            const parts = lastOrder.orderCode.split('-');
            nextNum = parseInt(parts[parts.length - 1]) + 1;
        }
        const year = new Date().getFullYear();
        body.orderCode = `NGR-${year}-${String(nextNum).padStart(5, '0')}`;

        // Calculate totals
        let subtotal = 0;
        for (const item of body.items) {
            item.totalPrice = item.unitPrice * item.qty;
            subtotal += item.totalPrice;
        }
        body.subtotal = subtotal;
        body.total = subtotal - (body.discount || 0) + (body.shippingFee || 0);

        // Initialize timeline
        body.timeline = [
            {
                status: 'pending',
                note: 'Đơn hàng được tạo',
                updatedBy: body.processedBy || body.user,
                updatedAt: new Date(),
            },
        ];

        const order = await Order.create(body);

        // Deduct stock for all products in a single bulk operation
        const bulkOps = body.items.map((item: { product: string; qty: number }) => ({
            updateOne: {
                filter: { _id: item.product },
                update: { $inc: { stock: -item.qty, soldCount: item.qty } },
            },
        }));
        await Product.bulkWrite(bulkOps, { ordered: false });

        // Notify Admin panel in real-time
        try {
            await pusherServer.trigger('admin-channel', 'new-order', {
                orderCode: order.orderCode,
                total: order.total,
                customerName: order.customerInfo?.name || 'Khách vãng lai',
            });
        } catch (pusherErr) {
            console.error("Lỗi gửi thông báo Pusher:", pusherErr);
            // Ignore pusher error, don't break the order creation
        }

        return apiSuccess(order, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
