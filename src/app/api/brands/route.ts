import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Brand from '@/models/Brand';
import Product from '@/models/Product';
import Category from '@/models/Category';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);
        const filter: Record<string, unknown> = {};
        if (searchParams.get('active') === 'true') filter.isActive = true;

        // Only return brands that have at least one product (optionally in a specific category)
        if (searchParams.get('hasProducts') === 'true') {
            const productFilter: Record<string, unknown> = { isActive: true };
            const categoryId = searchParams.get('category');
            const categorySlug = searchParams.get('categorySlug');

            if (categoryId) {
                productFilter.category = categoryId;
            } else if (categorySlug) {
                const cat = await Category.findOne({ slug: categorySlug }).lean();
                if (cat) {
                    productFilter.category = cat._id;
                } else {
                    return apiPaginated([], 0, page, limit);
                }
            }

            const brandIds = await Product.distinct('brand', productFilter);
            filter._id = { $in: brandIds };
        }

        const [brands, total] = await Promise.all([
            Brand.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
            Brand.countDocuments(filter),
        ]);
        return apiPaginated(brands, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        if (!body.name || !body.slug) return apiError('name and slug are required');
        const existing = await Brand.findOne({ slug: body.slug });
        if (existing) return apiError('Brand slug already exists');
        const brand = await Brand.create(body);
        return apiSuccess(brand, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
