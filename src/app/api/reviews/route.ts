import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import Product from '@/models/Product';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/reviews
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};
        if (searchParams.get('product')) filter.product = searchParams.get('product');
        if (searchParams.get('user')) filter.user = searchParams.get('user');
        if (searchParams.get('approved') === 'true') filter.isApproved = true;
        if (searchParams.get('approved') === 'false') filter.isApproved = false;

        const rating = searchParams.get('rating');
        if (rating) filter.rating = Number(rating);

        const [reviews, total] = await Promise.all([
            Review.find(filter)
                .populate('user', 'name image')
                .populate('product', 'name slug images')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Review.countDocuments(filter),
        ]);

        return apiPaginated(reviews, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/reviews — Create review + update product average rating
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.product || !body.user || !body.rating) {
            return apiError('product, user, and rating are required');
        }

        // Check for duplicate review
        const existing = await Review.findOne({ product: body.product, user: body.user });
        if (existing) return apiError('You have already reviewed this product');

        const review = await Review.create(body);

        // Recalculate product ratings
        const stats = await Review.aggregate([
            { $match: { product: review.product, isApproved: true } },
            { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
        ]);

        if (stats.length > 0) {
            await Product.findByIdAndUpdate(body.product, {
                ratings: { avg: Math.round(stats[0].avg * 10) / 10, count: stats[0].count },
            });
        }

        return apiSuccess(review, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
