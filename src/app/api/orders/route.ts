import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Customer from '@/models/Customer';
import WarrantyCard from '@/models/WarrantyCard';
import LoyaltyPoints from '@/models/LoyaltyPoints';
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

        // 1. Tìm hoặc tạo Customer dựa vào SĐT nếu là POS/online mua hàng
        let customerId = body.user;
        const phone = body.customerInfo?.phone;
        const name = body.customerInfo?.name || 'Khách vãng lai';
        const email = body.customerInfo?.email || '';

        if (phone) {
            let customer = await Customer.findOne({ phone: phone.trim() });
            if (!customer) {
                customer = await Customer.create({
                    name: name.trim(),
                    phone: phone.trim(),
                    email: email.trim() || undefined,
                    customerType: 'regular',
                    status: 'active',
                    source: body.channel || 'pos',
                });
            }
            customerId = customer._id;
            body.user = customerId;
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

        if (body.status === 'delivered') {
            body.timeline.push({
                status: 'delivered',
                note: 'Đã giao hàng và thanh toán thành công',
                updatedBy: body.processedBy || body.user,
                updatedAt: new Date(),
            });
        }

        const order = await Order.create(body);

        // Deduct stock for all products in a single bulk operation
        const bulkOps = body.items.map((item: { product: string; qty: number }) => ({
            updateOne: {
                filter: { _id: item.product },
                update: { $inc: { stock: -item.qty, soldCount: item.qty } },
            },
        }));
        await Product.bulkWrite(bulkOps, { ordered: false });

        // 2. Tự động sinh thẻ bảo hành nếu đơn hàng hoàn thành (delivered)
        if (body.status === 'delivered' && customerId) {
            for (const item of body.items) {
                const prod = await Product.findById(item.product);
                if (prod) {
                    const months = prod.warrantyMonths || 12; // Mặc định 12 tháng
                    const purchaseDate = new Date();
                    const startDate = new Date();
                    const endDate = new Date();
                    endDate.setMonth(endDate.getMonth() + months);

                    // Mỗi sản phẩm/số lượng bán ra sẽ tạo 1 thẻ bảo hành riêng biệt
                    for (let i = 0; i < item.qty; i++) {
                        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                        const warrantyNumber = `WARR-${order.orderCode.replace('NGR-', '')}-${randomSuffix}-${i + 1}`;
                        
                        await WarrantyCard.create({
                            warrantyNumber,
                            product: prod._id,
                            order: order._id,
                            customer: customerId,
                            serialNumber: '', // Nhân viên có thể update serial sau
                            warrantyType: 'store',
                            purchaseDate,
                            warrantyStartDate: startDate,
                            warrantyEndDate: endDate,
                            warrantyMonths: months,
                            status: 'active',
                            notes: `Sinh tự động từ đơn hàng POS ${order.orderCode}`,
                        });
                    }
                }
            }
        }

        // 3. Tự động cộng điểm loyalty khi đơn đã hoàn tất
        if (body.status === 'delivered' && customerId) {
            const total = Math.max(0, Number(order.total) || 0);

            // Rule:
            // - 1.000đ = 1 điểm
            // - Nếu đơn < 1.000.000đ thì tối thiểu +500 điểm
            let earnedPoints = Math.floor(total / 1000);
            if (total > 0 && total < 1_000_000) {
                earnedPoints = Math.max(earnedPoints, 500);
            }

            if (earnedPoints > 0) {
                // tránh cộng trùng nếu retry request với cùng order
                const existedLoyalty = await LoyaltyPoints.findOne({
                    order: order._id,
                    pointsType: 'earned',
                });

                if (!existedLoyalty) {
                    await LoyaltyPoints.create({
                        customer: customerId,
                        points: earnedPoints,
                        pointsType: 'earned',
                        order: order._id,
                        description: `Tích điểm tự động từ đơn hàng ${order.orderCode}`,
                        expiryDate: null,
                    });

                    await Customer.findByIdAndUpdate(customerId, {
                        $inc: { loyaltyPoints: earnedPoints },
                    });
                }
            }
        }

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
