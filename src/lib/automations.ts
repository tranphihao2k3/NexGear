import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Inventory from '@/models/Inventory';
import WarrantyCard from '@/models/WarrantyCard';
import LoyaltyPoints from '@/models/LoyaltyPoints';
import Notification from '@/models/Notification';
import ProductUnit from '@/models/ProductUnit';
import Customer from '@/models/Customer';
import BuybackOrder from '@/models/BuybackOrder';
import Return from '@/models/Return';
import Coupon from '@/models/Coupon';
import Product from '@/models/Product';

/**
 * Tự động chạy khi Order được giao thành công (delivered)
 * 1. Trừ kho (Inventory)
 * 2. Tạo WarrantyCard
 * 3. Cộng điểm Loyalty
 * 4. Gửi Notification
 */
export async function onOrderDelivered(orderId: string) {
    await dbConnect();

    const order = await Order.findById(orderId);
    if (!order) {
        throw new Error(`Order not found: ${orderId}`);
    }

    console.log(`🚀 [AUTOMATION] Processing order delivered: ${order._id}`);

    const results: Record<string, unknown> = {
        inventoryUpdated: false,
        warrantyCardsCreated: false,
        loyaltyPointsAdded: false,
        notificationsSent: false,
    };

    // ========================================
    // 1. TRỪ KHO - Update Inventory
    // ========================================
    try {
        for (const item of order.items) {
            // Tìm inventory của sản phẩm
            const inventory = await Inventory.findOne({ product: item.product });

            if (inventory) {
                await Inventory.findByIdAndUpdate(inventory._id, {
                    $inc: {
                        quantity: -(item.quantity || 1),
                        availableQuantity: -(item.quantity || 1),
                    },
                });

                console.log(`   ✅ [INVENTORY] Decremented ${item.quantity || 1} for product ${item.product}`);
            } else {
                console.log(`   ⚠️ [INVENTORY] No inventory found for product ${item.product}`);
            }

            // Cập nhật ProductUnit status thành sold nếu có
            if (item.productUnit) {
                await ProductUnit.findByIdAndUpdate(item.productUnit, {
                    status: 'sold',
                });
                console.log(`   ✅ [PRODUCT UNIT] Marked as sold: ${item.productUnit}`);
            }
        }
        results.inventoryUpdated = true;
    } catch (error: unknown) {
        console.error(`   ❌ [INVENTORY] Error:`, (error as Error).message);
    }

    // ========================================
    // 2. TẠO WARRANTY CARD - Tự động tạo bảo hành
    // ========================================
    try {
        const firstItem = order.items[0];
        if (firstItem && firstItem.product) {
            const product = await Product.findById(firstItem.product);

            if (product) {
                // Tạo warranty card cho từng sản phẩm trong đơn
                const warrantiesCreated = [];
                for (const item of order.items) {
                    // Generate warranty number: WR + YY + MM + XXXX
                    const now = new Date();
                    const year = now.getFullYear().toString().slice(-2);
                    const month = (now.getMonth() + 1).toString().padStart(2, '0');
                    const random = Math.floor(1000 + Math.random() * 9000);
                    const warrantyNumber = `WR${year}${month}${random}`;

                    const warrantyMonths = product.warrantyMonths || 12;
                    const warrantyStartDate = new Date();
                    const warrantyEndDate = new Date();
                    warrantyEndDate.setMonth(warrantyEndDate.getMonth() + warrantyMonths);

                    const wc = await WarrantyCard.create({
                        warrantyNumber,
                        product: item.product,
                        order: order._id,
                        customer: order.customer,
                        productUnit: item.productUnit || undefined,
                        serialNumber: item.serialNumber || '',
                        warrantyType: 'store',
                        warrantyStartDate,
                        warrantyEndDate,
                        warrantyMonths,
                        status: 'active',
                        notes: `Tự động tạo từ đơn hàng ${order._id}`,
                    });

                    warrantiesCreated.push(warrantyNumber);
                    console.log(`   ✅ [WARRANTY] Created warranty card: ${warrantyNumber}`);
                }
                results.warrantyCardsCreated = warrantiesCreated;
            }
        }
    } catch (error: unknown) {
        console.error(`   ❌ [WARRANTY] Error:`, (error as Error).message);
    }

    // ========================================
    // 3. CỘNG ĐIỂM LOYALTY
    // ========================================
    try {
        const customerId = order.customer;
        const totalAmount = order.total || 0;

        if (customerId && totalAmount > 0) {
            // Rule: 100,000 VND = 1 điểm (có thể config)
            const POINTS_PER_AMOUNT = 100000;
            const points = Math.floor(totalAmount / POINTS_PER_AMOUNT);

            if (points > 0) {
                // Tính ngày hết hạn (12 tháng)
                const expiryDate = new Date();
                expiryDate.setMonth(expiryDate.getMonth() + 12);

                await LoyaltyPoints.create({
                    customer: customerId,
                    points,
                    pointsType: 'earned',
                    order: order._id,
                    description: `Đặt hàng ${order._id} - Giá trị: ${totalAmount.toLocaleString('vi-VN')} VND`,
                    expiryDate,
                });

                // Cập nhật tổng điểm trong Customer
                await Customer.findByIdAndUpdate(customerId, {
                    $inc: { loyaltyPoints: points },
                });

                console.log(`   ✅ [LOYALTY] Added ${points} points to customer ${customerId}`);
                results.loyaltyPointsAdded = points;
            }
        }
    } catch (error: unknown) {
        console.error(`   ❌ [LOYALTY] Error:`, (error as Error).message);
    }

    // ========================================
    // 4. GỬI NOTIFICATION
    // ========================================
    try {
        // Notification cho admin
        await Notification.create({
            type: 'order',
            title: 'Đơn hàng đã giao',
            message: `Đơn hàng ${order._id} đã được giao thành công. Giá trị: ${(order.total || 0).toLocaleString('vi-VN')} VND`,
            priority: 'normal',
        });

        // Notification cho khách hàng
        if (order.customer) {
            await Notification.create({
                user: order.customer,
                type: 'order',
                title: 'Cảm ơn bạn đã mua hàng!',
                message: `Đơn hàng ${order._id} đã được giao thành công. Cảm ơn bạn đã tin tưởng NexGear!`,
                priority: 'normal',
            });
        }

        results.notificationsSent = true;
        console.log(`   ✅ [NOTIFICATION] Notifications sent`);
    } catch (error: unknown) {
        console.error(`   ❌ [NOTIFICATION] Error:`, (error as Error).message);
    }

    console.log(`✅ [AUTOMATION] Order ${order._id} processed:`, results);
    return results;
}

/**
 * Tự động chạy khi Buyback Order được duyệt
 * Tạo voucher tự động với giá trị = giá mua lại
 */
export async function onBuybackApproved(buybackOrderId: string) {
    await dbConnect();

    const buybackOrder = await BuybackOrder.findById(buybackOrderId);
    if (!buybackOrder) {
        throw new Error(`Buyback order not found: ${buybackOrderId}`);
    }

    console.log(`🚀 [AUTOMATION] Processing buyback approved: ${buybackOrder._id}`);

    // Tạo voucher
    const code = `TRADE${buybackOrder._id.toString().slice(-6).toUpperCase()}`;
    const validTo = new Date();
    validTo.setMonth(validTo.getMonth() + 3); // 3 tháng

    const voucher = await Coupon.create({
        code,
        description: `Voucher thu cũ đổi mới`,
        discountType: 'fixed',
        discountValue: buybackOrder.buybackPrice || 0,
        minOrderAmount: buybackOrder.buybackPrice || 0,
        validFrom: new Date(),
        validTo,
        maxUses: 1,
        isActive: true,
    });

    // Cập nhật buyback order
    await BuybackOrder.findByIdAndUpdate(buybackOrderId, {
        status: 'approved',
        approvedAt: new Date(),
        coupon: voucher._id,
    });

    // Gửi notification
    await Notification.create({
        type: 'promotion',
        title: 'Voucher thu cũ đổi mới',
        message: `Voucher ${code} trị giá ${(buybackOrder.buybackPrice || 0).toLocaleString('vi-VN')} VND đã được tạo`,
        priority: 'normal',
    });

    console.log(`✅ [AUTOMATION] Voucher created: ${code}`);

    return {
        voucherId: voucher._id,
        voucherCode: code,
        voucherValue: buybackOrder.buybackPrice,
    };
}

/**
 * Tự động chạy khi Return được duyệt
 * Hoàn lại kho nếu là refund
 */
export async function onReturnApproved(returnId: string) {
    await dbConnect();

    const returnOrder = await Return.findById(returnId);
    if (!returnOrder) {
        throw new Error(`Return not found: ${returnId}`);
    }

    console.log(`🚀 [AUTOMATION] Processing return approved: ${returnOrder._id}`);

    // Lấy order gốc để lấy thông tin sản phẩm
    const originalOrder = await Order.findById(returnOrder.order);

    if (returnOrder.returnType === 'refund' && originalOrder) {
        // Hoàn lại kho
        for (const item of originalOrder.items) {
            await Inventory.findOneAndUpdate(
                { product: item.product },
                {
                    $inc: {
                        quantity: item.quantity || 1,
                        availableQuantity: item.quantity || 1,
                    },
                }
            );
            console.log(`   ✅ [INVENTORY] Returned ${item.quantity || 1} for product ${item.product}`);
        }
    }

    // Cập nhật return status
    await Return.findByIdAndUpdate(returnId, {
        status: 'processed',
        processedAt: new Date(),
    });

    console.log(`✅ [AUTOMATION] Return processed: ${returnOrder._id}`);

    return { success: true };
}

/**
 * Tự động xử lý điểm Loyalty hết hạn (chạy qua cron job)
 */
export async function processExpiredLoyaltyPoints() {
    await dbConnect();

    const now = new Date();

    // Tìm tất cả points đã hết hạn và chưa được xử lý
    const expiredPoints = await LoyaltyPoints.find({
        expiryDate: { $lt: now },
        pointsType: { $ne: 'expired' },
    });

    console.log(`🚀 [AUTOMATION] Processing ${expiredPoints.length} expired loyalty points`);

    let processedCount = 0;

    for (const point of expiredPoints) {
        // Tạo bản ghi expired
        await LoyaltyPoints.create({
            customer: point.customer,
            points: -(point.points || 0),
            pointsType: 'expired',
            order: point.order,
            description: `Điểm thưởng hết hạn: ${point.description}`,
            expiryDate: null,
        });

        // Cập nhật tổng điểm trong Customer
        await Customer.findByIdAndUpdate(point.customer, {
            $inc: { loyaltyPoints: -(point.points || 0) },
        });

        processedCount++;
    }

    console.log(`✅ [AUTOMATION] Processed ${processedCount} expired points`);

    return { processedCount };
}
