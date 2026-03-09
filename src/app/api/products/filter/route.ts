import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

/**
 * Advanced product filter endpoint
 * GET /api/products/filter
 *
 * Query params:
 * - page, limit: pagination
 * - search: text search (name, tags)
 * - category: category ID
 * - brand: brand ID
 * - minPrice, maxPrice: price range
 * - condition: new | like_new | used | refurbished
 * - usedGrade: A | B | C
 * - isUsed: true | false (also filter by condition if true)
 * - warranty: warranty months (e.g., 12+)
 * - inStock: true | false
 * - tags: comma-separated tags
 * - ratings: minimum rating (e.g., 4)
 * - sortBy: name | price | rating | popularity | newest
 * - sortDir: asc | desc (default: asc for name, desc for others)
 */

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = { isActive: true };

        // 1. Text search (name, tags)
        const search = searchParams.get('search') || searchParams.get('q');
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } },
                { sku: { $regex: search, $options: 'i' } },
            ];
        }

        // 2. Category
        if (searchParams.get('category')) {
            filter.category = searchParams.get('category');
        }

        // 3. Brand
        if (searchParams.get('brand')) {
            filter.brand = searchParams.get('brand');
        }

        // 4. Price range
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        if (minPrice || maxPrice) {
            filter.basePrice = {};
            if (minPrice) (filter.basePrice as Record<string, unknown>).$gte = parseInt(minPrice);
            if (maxPrice) (filter.basePrice as Record<string, unknown>).$lte = parseInt(maxPrice);
        }

        // 5. Condition (new / used)
        const isUsed = searchParams.get('isUsed');
        if (isUsed !== null) {
            filter.isUsed = isUsed === 'true';
        }

        const condition = searchParams.get('condition');
        if (condition && ['new', 'like_new', 'used', 'refurbished'].includes(condition)) {
            filter.condition = condition;
        }

        // 6. Used grade
        const usedGrade = searchParams.get('usedGrade');
        if (usedGrade && ['A', 'B', 'C'].includes(usedGrade)) {
            filter.usedGrade = usedGrade;
        }

        // 7. Warranty
        const warranty = searchParams.get('warranty');
        if (warranty) {
            const months = parseInt(warranty);
            filter.warrantyMonths = { $gte: months };
        }

        // 8. In stock
        const inStock = searchParams.get('inStock');
        if (inStock === 'true') {
            filter.stock = { $gt: 0 };
        }

        // 9. Rating
        const minRating = searchParams.get('ratings');
        if (minRating) {
            filter['ratings.avg'] = { $gte: parseFloat(minRating) };
        }

        // 10. Tags (comma-separated)
        const tagsParam = searchParams.get('tags');
        if (tagsParam) {
            const tags = tagsParam.split(',').map(t => t.trim());
            filter.tags = { $in: tags };
        }

        // 11. Sort
        let sortOptions: Record<string, 1 | -1> = { createdAt: -1 };
        const sortBy = searchParams.get('sortBy') || 'newest';
        const sortDir = searchParams.get('sortDir') || 'desc';
        const sortOrder = sortDir === 'asc' ? 1 : -1;

        switch (sortBy) {
            case 'name':
                sortOptions = { name: 1 };
                break;
            case 'price':
                sortOptions = { basePrice: sortOrder };
                break;
            case 'rating':
                sortOptions = { 'ratings.avg': -1, 'ratings.count': -1 };
                break;
            case 'popularity':
                sortOptions = { soldCount: -1, viewCount: -1 };
                break;
            case 'newest':
            default:
                sortOptions = { createdAt: -1 };
        }

        const [products, total] = await Promise.all([
            Product.find(filter)
                .populate('category', 'name slug')
                .populate('brand', 'name slug')
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .select('-description -specs') // Exclude heavy fields in list
                .lean(),
            Product.countDocuments(filter),
        ]);

        return apiPaginated(products, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
