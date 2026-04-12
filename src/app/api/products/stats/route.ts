import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { apiSuccess, apiError } from '@/lib/api-helpers';

// GET /api/products/stats — lightweight product count + avg rating
export async function GET() {
    try {
        await dbConnect();

        const [countResult] = await Product.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    avgRating: { $avg: '$ratings.avg' },
                    totalReviews: { $sum: '$ratings.count' },
                },
            },
        ]);

        const total = countResult?.total || 0;
        const avgRating = countResult?.avgRating
            ? Math.round(countResult.avgRating * 10) / 10
            : 5;
        const totalReviews = countResult?.totalReviews || 0;

        return apiSuccess(
            { total, avgRating, totalReviews },
            200,
            { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
        );
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
