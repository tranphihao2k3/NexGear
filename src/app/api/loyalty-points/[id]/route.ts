import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LoyaltyPoints from '@/models/LoyaltyPoints';
import Customer from '@/models/Customer';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

// GET /api/loyalty-points/[id]
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const points = await LoyaltyPoints.findById(id)
            .populate('customer', 'name phone email loyaltyPoints')
            .populate('order', 'orderNumber status createdAt')
            .lean();

        if (!points) return apiError('LoyaltyPoints record not found', 404);

        return apiSuccess(points);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/loyalty-points/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        // Updating points logic can be complex because it affects the total balance
        const existingCard = await LoyaltyPoints.findById(id);
        if (!existingCard) return apiError('LoyaltyPoints record not found', 404);

        if (body.points !== undefined || body.pointsType !== undefined) {
            const customer = await Customer.findById(existingCard.customer);
            if (customer) {
                // Revert previous change
                let prevChange = existingCard.points;
                if (['redeemed', 'expired'].includes(existingCard.pointsType)) prevChange = -prevChange;

                // Calculate new change
                let newChange = body.points !== undefined ? Number(body.points) : existingCard.points;
                const newType = body.pointsType || existingCard.pointsType;
                if (['redeemed', 'expired'].includes(newType)) newChange = -Math.abs(newChange);

                const netDifference = newChange - prevChange;

                customer.loyaltyPoints += netDifference;
                await customer.save();

                body.points = Math.abs(Number(newChange));
            }
        }

        const pointRecord = await LoyaltyPoints.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        }).lean();

        return apiSuccess(pointRecord);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/loyalty-points/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        const existingCard = await LoyaltyPoints.findById(id);
        if (!existingCard) return apiError('LoyaltyPoints record not found', 404);

        const customer = await Customer.findById(existingCard.customer);
        if (customer) {
            let prevChange = existingCard.points;
            if (['redeemed', 'expired'].includes(existingCard.pointsType)) prevChange = -prevChange;
            customer.loyaltyPoints -= prevChange;
            await customer.save();
        }

        await LoyaltyPoints.findByIdAndDelete(id);

        return apiSuccess({ message: 'LoyaltyPoints record deleted' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
