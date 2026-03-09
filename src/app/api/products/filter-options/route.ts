import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';
import Brand from '@/models/Brand';
import { apiSuccess, apiError } from '@/lib/api-helpers';

/**
 * Get available product filter options
 * GET /api/products/filter-options
 *
 * Returns:
 * - categories: all active categories
 * - brands: all brands with products
 * - priceRange: { min, max }
 * - conditions: available conditions (new, like_new, used, refurbished)
 * - usedGrades: available grades (A, B, C)
 * - warrantyOptions: common warranty durations
 * - tags: all available tags
 */

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);

        // Filter only active products
        const baseFilter: Record<string, unknown> = { isActive: true };

        // Optional: apply other filters to narrow down options
        const categoryFilter: Record<string, unknown> = {};
        const category = searchParams.get('category');
        if (category) {
            categoryFilter._id = category;
            baseFilter.category = category;
        }

        // 1. Get all categories
        const categories = await Category.find(categoryFilter).select('name slug').lean();

        // 2. Get brands with products in filter
        const brandsAgg = await Product.aggregate([
            { $match: baseFilter },
            {
                $group: {
                    _id: '$brand',
                    productCount: { $sum: 1 },
                },
            },
            { $sort: { productCount: -1 } },
        ]);

        const brandIds = brandsAgg.map(b => b._id);
        const brands = await Brand.find({ _id: { $in: brandIds } })
            .select('name slug')
            .lean();

        // 3. Get price range
        const priceStats = await Product.aggregate([
            { $match: baseFilter },
            {
                $group: {
                    _id: null,
                    minPrice: { $min: '$basePrice' },
                    maxPrice: { $max: '$basePrice' },
                },
            },
        ]);

        const { minPrice = 0, maxPrice = 100000000 } = priceStats[0] || {};

        // 4. Get available conditions and used grades
        const conditionAgg = await Product.aggregate([
            { $match: baseFilter },
            {
                $group: {
                    _id: null,
                    conditions: { $addToSet: '$condition' },
                    usedGrades: { $addToSet: '$usedGrade' },
                },
            },
        ]);

        const conditions = conditionAgg[0]?.conditions?.filter(Boolean) || ['new'];
        const usedGrades = conditionAgg[0]?.usedGrades?.filter(Boolean) || [];

        // 5. Get warranty options
        const warrantyAgg = await Product.aggregate([
            { $match: baseFilter },
            { $group: { _id: '$warrantyMonths' } },
            { $sort: { _id: 1 } },
        ]);

        const warrantyOptions = warrantyAgg
            .map(w => w._id)
            .filter(Boolean)
            .sort((a, b) => a - b);

        // 6. Get all tags
        const tagAgg = await Product.aggregate([
            { $match: baseFilter },
            { $unwind: '$tags' },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 50 },
        ]);

        const tags = tagAgg.map(t => ({ name: t._id, count: t.count }));

        // 7. Get rating options
        const ratingOptions = [1, 2, 3, 4, 4.5];

        return apiSuccess({
            categories,
            brands,
            priceRange: {
                min: Math.floor(minPrice),
                max: Math.ceil(maxPrice),
            },
            conditions,
            usedGrades,
            warrantyOptions,
            ratingOptions,
            tags,
        });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
