import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';
import Brand from '@/models/Brand';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

function toObjectId(id: string) {
    return new mongoose.Types.ObjectId(id);
}
function toObjectIds(ids: string[]) {
    return ids.map(id => new mongoose.Types.ObjectId(id));
}

// GET /api/products — List with filters
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        // Filters
        const productType = searchParams.get('productType');
        if (productType) filter.productType = productType;

        const componentType = searchParams.get('componentType');
        if (componentType) filter.componentType = componentType;

        if (searchParams.get('active') === 'true') filter.isActive = true;
        if (searchParams.get('featured') === 'true') filter.isFeatured = true;

        const categoryId = searchParams.get('category');
        const categorySlug = searchParams.get('categorySlug');

        if (categoryId) {
            filter.category = toObjectId(categoryId);
        } else if (categorySlug) {
            const cat = await Category.findOne({ slug: categorySlug }).lean();
            if (cat) {
                // Include products from child sub-categories too
                const children = await Category.find({ parent: (cat as any)._id }).lean();
                if (children.length > 0) {
                    filter.category = { $in: [(cat as any)._id, ...children.map((c: any) => c._id)] };
                } else {
                    filter.category = (cat as any)._id;
                }
            } else {
                return apiPaginated([], 0, page, limit);
            }
        }

        if (searchParams.get('brand')) {
            const brands = searchParams.get('brand')?.split(',') || [];
            if (brands.length > 0) filter.brand = { $in: toObjectIds(brands) };
        }

        const tag = searchParams.get('tag');
        if (tag) filter.tags = { $in: [tag] };

        const search = searchParams.get('search') || searchParams.get('q');
        if (search) filter.$text = { $search: search };

        // Specs filter: specs=Switch:Cherry MX Red,Layout:65%|75%
        // Alias map: canonical filter key → các DB key tương đương
        const FILTER_KEY_ALIASES: Record<string, string[]> = {
            'GPU': ['GPU', 'Card đồ họa'],
            'Ổ cứng': ['Ổ cứng', 'SSD', 'HDD'],
        };

        const specsParam = searchParams.get('specs');
        if (specsParam) {
            const specEntries = specsParam.split(',');
            const orConditions: Record<string, unknown>[] = [];
            for (const entry of specEntries) {
                const colonIdx = entry.indexOf(':');
                if (colonIdx === -1) continue;
                const key = entry.substring(0, colonIdx);
                const valPart = entry.substring(colonIdx + 1);
                const values = valPart.split('|');
                const valueQuery = values.length === 1 ? values[0] : { $in: values };

                const dbKeys = FILTER_KEY_ALIASES[key] ?? [key];
                if (dbKeys.length === 1) {
                    // Không có alias, query trực tiếp
                    filter[`specs.${dbKeys[0]}`] = valueQuery;
                } else {
                    // Có alias → dùng $or để match cả 2 key
                    const orParts = dbKeys.map(k => ({ [`specs.${k}`]: valueQuery }));
                    orConditions.push(...orParts);
                }
            }
            if (orConditions.length > 0) {
                // Merge với filter.$or có sẵn nếu có
                if (filter.$or) {
                    filter.$and = [{ $or: filter.$or as Record<string, unknown>[] }, { $or: orConditions }];
                    delete filter.$or;
                } else {
                    filter.$or = orConditions;
                }
            }
        }

        // Price range
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        if (minPrice || maxPrice) {
            filter.basePrice = {};
            if (minPrice) (filter.basePrice as Record<string, number>).$gte = Number(minPrice);
            if (maxPrice) (filter.basePrice as Record<string, number>).$lte = Number(maxPrice);
        }

        // Low stock filter
        if (searchParams.get('lowStock') === 'true') {
            filter.$expr = { $lte: ['$stock', '$lowStockAlert'] };
        }

        // Sort
        const sortBy = searchParams.get('sort') || '-createdAt';
        const sortMap: Record<string, any> = {
            'price-asc': { basePrice: 1 },
            'price-desc': { basePrice: -1 },
            'basePrice': { basePrice: 1 },
            '-basePrice': { basePrice: -1 },
            'best-selling': { soldCount: -1 },
            '-soldCount': { soldCount: -1 },
            'newest': { createdAt: -1 },
            'name': { name: 1 },
            '-createdAt': { createdAt: -1 },
        };
        const sort = sortMap[sortBy] || { createdAt: -1 };

        // Projection — hide costPrice from public
        const isAdmin = searchParams.get('admin') === 'true';
        const projection = isAdmin ? {} : { costPrice: 0 };

        // Put out-of-stock products at the end, then apply user sort
        const finalSort = { _inStock: -1, ...sort };

        const [products, total] = await Promise.all([
            Product.aggregate([
                { $match: filter },
                { $addFields: { _inStock: { $cond: [{ $gt: ['$stock', 0] }, 1, 0] } } },
                { $sort: finalSort },
                { $skip: skip },
                { $limit: limit },
                // $lookup replaces post-query populate — runs inside the pipeline
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'category',
                        foreignField: '_id',
                        pipeline: [{ $project: { name: 1, slug: 1 } }],
                        as: '_cat',
                    },
                },
                {
                    $lookup: {
                        from: 'brands',
                        localField: 'brand',
                        foreignField: '_id',
                        pipeline: [{ $project: { name: 1, slug: 1, logo: 1 } }],
                        as: '_brand',
                    },
                },
                {
                    $addFields: {
                        category: { $arrayElemAt: ['$_cat', 0] },
                        brand: { $arrayElemAt: ['$_brand', 0] },
                    },
                },
                { $project: { _cat: 0, _brand: 0, _inStock: 0, ...(isAdmin ? {} : { costPrice: 0 }) } },
            ]),
            Product.countDocuments(filter),
        ]);

        return apiPaginated(products, total, page, limit, {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/products — Create product
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.name || !body.slug || !body.sku || !body.basePrice) {
            return apiError('name, slug, sku, and basePrice are required');
        }

        if (body.productType !== 'component' && (!body.category || !body.brand)) {
            return apiError('category and brand are required for products');
        }

        // Check uniqueness
        const existingSlug = await Product.findOne({ slug: body.slug });
        if (existingSlug) return apiError('Product slug already exists');

        const existingSku = await Product.findOne({ sku: body.sku });
        if (existingSku) return apiError('Product SKU already exists');

        const product = await Product.create(body);
        return apiSuccess(product, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
