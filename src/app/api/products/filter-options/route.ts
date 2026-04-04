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
 * Optimized: uses $facet to run all Product aggregations in a single DB round-trip,
 * plus parallel Category + Brand queries.
 */

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);

        const baseFilter: Record<string, unknown> = { isActive: true };
        const categoryFilter: Record<string, unknown> = {};
        const category = searchParams.get('category');
        if (category) {
            categoryFilter._id = category;
            baseFilter.category = category;
        }

        // Single $facet aggregation combines brands, price, conditions, warranty, tags
        const [facetResult, categories] = await Promise.all([
            Product.aggregate([
                { $match: baseFilter },
                {
                    $facet: {
                        brands: [
                            { $group: { _id: '$brand', productCount: { $sum: 1 } } },
                            { $sort: { productCount: -1 } },
                        ],
                        priceRange: [
                            {
                                $group: {
                                    _id: null,
                                    minPrice: { $min: '$basePrice' },
                                    maxPrice: { $max: '$basePrice' },
                                },
                            },
                        ],
                        conditionsAndGrades: [
                            {
                                $group: {
                                    _id: null,
                                    conditions: { $addToSet: '$condition' },
                                    usedGrades: { $addToSet: '$usedGrade' },
                                },
                            },
                        ],
                        warranty: [
                            { $group: { _id: '$warrantyMonths' } },
                            { $sort: { _id: 1 } },
                        ],
                        tags: [
                            { $unwind: '$tags' },
                            { $group: { _id: '$tags', count: { $sum: 1 } } },
                            { $sort: { count: -1 } },
                            { $limit: 50 },
                        ],
                    },
                },
            ]),
            Category.find(categoryFilter).select('name slug').lean(),
        ]);

        const facet = facetResult[0] || {};

        // Resolve brand details in one query
        const brandIds = (facet.brands || []).map((b: { _id: string }) => b._id);
        const brands = brandIds.length > 0
            ? await Brand.find({ _id: { $in: brandIds } }).select('name slug').lean()
            : [];

        const priceStats = facet.priceRange?.[0] || {};
        const { minPrice = 0, maxPrice = 100000000 } = priceStats;

        const condData = facet.conditionsAndGrades?.[0] || {};
        const conditions = condData.conditions?.filter(Boolean) || ['new'];
        const usedGrades = condData.usedGrades?.filter(Boolean) || [];

        const warrantyOptions = (facet.warranty || [])
            .map((w: { _id: number }) => w._id)
            .filter(Boolean)
            .sort((a: number, b: number) => a - b);

        const tags = (facet.tags || []).map((t: { _id: string; count: number }) => ({
            name: t._id,
            count: t.count,
        }));

        const ratingOptions = [1, 2, 3, 4, 4.5];

        return apiSuccess(
            {
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
            },
            200,
            { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
        );
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
