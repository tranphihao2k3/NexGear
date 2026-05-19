import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import WarrantyCard from '@/models/WarrantyCard';
import Customer from '@/models/Customer';
import Product from '@/models/Product';
import { apiSuccess, apiError } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q')?.trim();

        if (!q) {
            return apiError('Vui lòng nhập số điện thoại hoặc mã bảo hành / serial để tra cứu.', 400);
        }

        let filter: Record<string, any> = {};

        // Thử tìm khách hàng theo số điện thoại trước
        const customers = await Customer.find({ phone: new RegExp(q, 'i') }).select('_id');
        
        if (customers.length > 0) {
            const customerIds = customers.map(c => c._id);
            filter = { customer: { $in: customerIds } };
        } else {
            // Nếu không phải số điện thoại, tìm theo mã bảo hành hoặc số serial
            filter = {
                $or: [
                    { warrantyNumber: { $regex: q, $options: 'i' } },
                    { serialNumber: { $regex: q, $options: 'i' } }
                ]
            };
        }

        const warrantyCards = await WarrantyCard.find(filter)
            .populate('product', 'name sku images warrantyMonths')
            .populate('customer', 'name phone')
            .populate('order', 'orderCode status createdAt')
            .sort({ createdAt: -1 })
            .lean();

        return apiSuccess(warrantyCards);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
