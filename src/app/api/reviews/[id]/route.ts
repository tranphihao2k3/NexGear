import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import Product from '@/models/Product';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const review = await Review.findById(id)
            .populate('user', 'name image')
            .populate('product', 'name slug')
            .lean();
        if (!review) return apiError('Review not found', 404);
        return apiSuccess(review);
    } catch (error) { return apiError((error as Error).message, 500); }
}

// PUT - Approve/reject review
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();
        const review = await Review.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();
        if (!review) return apiError('Review not found', 404);

        // Recalculate product rating if approval status changed
        if (body.isApproved !== undefined) {
            const stats = await Review.aggregate([
                { $match: { product: review.product, isApproved: true } },
                { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
            ]);
            const ratings = stats.length > 0
                ? { avg: Math.round(stats[0].avg * 10) / 10, count: stats[0].count }
                : { avg: 0, count: 0 };
            await Product.findByIdAndUpdate(review.product, { ratings });
        }

        return apiSuccess(review);
    } catch (error) { return apiError((error as Error).message, 500); }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const review = await Review.findByIdAndDelete(id);
        if (!review) return apiError('Review not found', 404);

        // Recalculate product rating after deletion
        const stats = await Review.aggregate([
            { $match: { product: review.product, isApproved: true } },
            { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
        ]);
        const ratings = stats.length > 0
            ? { avg: Math.round(stats[0].avg * 10) / 10, count: stats[0].count }
            : { avg: 0, count: 0 };
        await Product.findByIdAndUpdate(review.product, { ratings });

        return apiSuccess({ message: 'Review deleted' });
    } catch (error) { return apiError((error as Error).message, 500); }
}
