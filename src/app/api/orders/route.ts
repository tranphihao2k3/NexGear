import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
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

        const normalizePhone = (input: string) => {
            let p = String(input || '').trim().replace(/\D/g, '');
            if (!p) return '';
            if (p.startsWith('84')) p = `0${p.slice(2)}`;
            if (!p.startsWith('0') && p.length === 9) p = `0${p}`;
            return p;
        };

        if (phone) {
            const rawPhone = String(phone).trim();
            const normalizedPhone = normalizePhone(rawPhone);

            // Build phone $or list — skip empty rawPhone to avoid matching empty-phone docs
            const phoneOrList: any[] = [];
            if (rawPhone) phoneOrList.push({ phone: rawPhone });
            if (normalizedPhone && normalizedPhone !== rawPhone) phoneOrList.push({ phone: normalizedPhone });
            if (normalizedPhone) phoneOrList.push({ phone: normalizedPhone.replace(/^0/, '84') });

            let customer = phoneOrList.length > 0
                ? await Customer.findOne({ $or: phoneOrList })
                : null;

            if (!customer) {
                customer = await Customer.create({
                    name: name.trim() || 'Khách hàng POS',
                    phone: normalizedPhone || rawPhone,
                    email: email.trim() || undefined,
                    customerType: 'regular',
                    status: 'active',
                    source: body.channel || 'pos',
                });
            } else {
                const nextName = name.trim();
                const nextEmail = email.trim();
                const shouldUpdateName = nextName && nextName.toLowerCase() !== 'khách lẻ' && customer.name !== nextName;
                const shouldUpdateEmail = nextEmail && !customer.email;
                const shouldNormalizePhone = normalizedPhone && customer.phone !== normalizedPhone;

                if (shouldUpdateName) customer.name = nextName;
                if (shouldUpdateEmail) customer.email = nextEmail;
                if (shouldNormalizePhone) customer.phone = normalizedPhone;

                if (shouldUpdateName || shouldUpdateEmail || shouldNormalizePhone) {
                    await customer.save();
                }
            }

            customerId = customer._id;
            body.user = customerId;
        } else if (body.channel === 'pos' && name?.trim() && name.trim().toLowerCase() !== 'khách lẻ') {
            // POS manual customer without phone: still keep a basic customer profile for later editing
            const fallbackPhone = `POS-${Date.now()}`;
            const customer = await Customer.create({
                name: name.trim(),
                phone: fallbackPhone,
                email: email.trim() || undefined,
                customerType: 'regular',
                status: 'active',
                source: 'pos',
            });
            customerId = customer._id;
            body.user = customerId;
        }

        // ──────────────────────────────────────────────────────────────
        // ✅ Fix #3: Atomic order code generation (race-condition safe)
        // Dùng $inc trên collection 'counters' — atomic tại MongoDB level.
        // Tránh 2 request đồng thời đọc cùng `lastOrder` → cùng orderCode.
        // ──────────────────────────────────────────────────────────────
        const year = new Date().getFullYear();
        const counterKey = `orderCode_${year}`;
        const Counter = mongoose.connection.collection('counters');
        const counterDoc = await Counter.findOneAndUpdate(
            { _id: counterKey } as any,
            { $inc: { seq: 1 } } as any,
            { upsert: true, returnDocument: 'after' } as any
        ) as any;
        const nextNum = counterDoc?.seq ?? 1;
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

        // ──────────────────────────────────────────────────────────────
        // ✅ Fix #1: Atomic stock decrement (tránh oversell khi 2 order
        // đồng thời). Dùng findOneAndUpdate với `stock: { $gte: qty }` —
        // nếu stock < qty, không match → return null → throw.
        // Chạy tuần tự để dễ debug; với bulk parallel có thể dùng
        // bulkWrite nhưng vẫn phải check từng result để rollback.
        // ──────────────────────────────────────────────────────────────
        const stockErrors: string[] = [];
        for (const item of body.items) {
            const productId = new mongoose.Types.ObjectId(item.product);
            const updated = await Product.findOneAndUpdate(
                { _id: productId, stock: { $gte: item.qty } },
                { $inc: { stock: -item.qty, soldCount: item.qty } },
                { new: true }
            ).select('_id name stock').lean();
            if (!updated) {
                stockErrors.push(`Sản phẩm ${item.name} (${item.product}) không đủ hàng`);
            }
        }
        if (stockErrors.length > 0) {
            return apiError(stockErrors.join('; '), 400);
        }

        // Create order (sau khi stock đã được reserve)
        const order = await Order.create(body);

        // ──────────────────────────────────────────────────────────────
        // ✅ Fix #2: Bulk fetch products + bulk insert warranty cards
        // Trước: N items → N Product.findById + N×qty WarrantyCard.create
        //        → tối đa 1+10×qty queries tuần tự (~1-2s)
        // Sau:   1 Product.find($in) + 1 insertMany (~50ms)
        // ──────────────────────────────────────────────────────────────
        if (body.status === 'delivered' && customerId) {
            const productIds = body.items.map((it: { product: string }) => new mongoose.Types.ObjectId(it.product));
            const products = await Product.find({ _id: { $in: productIds } })
                .select('_id name warrantyMonths')
                .lean();

            const productMap = new Map(products.map(p => [String(p._id), p]));
            const purchaseDate = new Date();
            const startDate = new Date();
            const warrantyDocs: any[] = [];
            const usedSeq = new Set<string>();

            for (const item of body.items) {
                const prod = productMap.get(String(item.product));
                if (!prod) continue;
                const months = prod.warrantyMonths || 12;
                const endDate = new Date(startDate);
                endDate.setMonth(endDate.getMonth() + months);

                for (let i = 0; i < item.qty; i++) {
                    // Unique suffix: orderCode + productId + i + counter để tránh trùng
                    const seq = `${order.orderCode}-${prod._id}-${i}`;
                    if (usedSeq.has(seq)) continue;
                    usedSeq.add(seq);

                    warrantyDocs.push({
                        warrantyNumber: `WARR-${order.orderCode.replace('NGR-', '')}-${prod._id.toString().slice(-4)}-${i + 1}`,
                        product: prod._id,
                        order: order._id,
                        customer: customerId,
                        serialNumber: '',
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

            if (warrantyDocs.length > 0) {
                await WarrantyCard.insertMany(warrantyDocs, { ordered: false });
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
