import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category';
import Product from '@/models/Product';
import { apiSuccess, apiError } from '@/lib/api-helpers';

// GET /api/storefront — Single endpoint returning categories + products for homepage
// Replaces N separate /api/products?categorySlug=X calls with 1 aggregated query
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const limitPerCategory = Math.min(Number(searchParams.get('limit')) || 8, 20);

        // 1. Fetch active root categories
        const allCategories = await Category.find({ isActive: true })
            .sort({ order: 1, name: 1 })
            .lean();

        // Build parent→children map
        const childrenMap = new Map<string, any[]>();
        const roots: any[] = [];
        for (const cat of allCategories) {
            if (cat.parent) {
                const pid = cat.parent.toString();
                if (!childrenMap.has(pid)) childrenMap.set(pid, []);
                childrenMap.get(pid)!.push(cat);
            } else {
                roots.push(cat);
            }
        }

        // Priority sort: laptop categories first
        const laptopSlugs = ['gaming-laptop', 'ultrabook', 'workstation', 'laptop-sinh-vien'];
        roots.sort((a, b) => {
            const aIdx = laptopSlugs.indexOf(a.slug);
            const bIdx = laptopSlugs.indexOf(b.slug);
            if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
            if (aIdx !== -1) return -1;
            if (bIdx !== -1) return 1;
            if (a.slug === 'laptop') return -1;
            if (b.slug === 'laptop') return 1;
            return 0;
        });

        // 2. For each root category, collect its ID + children IDs for product query
        const categoryGroups: { category: any; categoryIds: string[] }[] = [];
        for (const root of roots) {
            const rootId = root._id.toString();
            const children = childrenMap.get(rootId) || [];
            const ids = [root._id, ...children.map((c: any) => c._id)];
            categoryGroups.push({
                category: {
                    _id: rootId,
                    name: root.name,
                    slug: root.slug,
                    children: children.map((c: any) => ({
                        _id: c._id.toString(),
                        name: c.name,
                        slug: c.slug,
                    })),
                },
                categoryIds: ids,
            });
        }

        // 3. Single aggregation: fetch products for ALL categories at once
        // Uses $facet to get products per category in one DB round-trip
        const facetStages: Record<string, any[]> = {};
        for (const group of categoryGroups) {
            facetStages[group.category.slug] = [
                { $match: { category: { $in: group.categoryIds }, isActive: { $ne: false } } },
                { $addFields: { _inStock: { $cond: [{ $gt: ['$stock', 0] }, 1, 0] } } },
                { $sort: { _inStock: -1, createdAt: -1 } },
                { $limit: limitPerCategory },
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
                        brand: { $arrayElemAt: ['$_brand', 0] },
                    },
                },
                { $project: { _brand: 0, _inStock: 0, costPrice: 0 } },
            ];
        }

        const [facetResult] = await Product.aggregate([{ $facet: facetStages }]);

        // 4. Combine into response
        const sections = categoryGroups.map((group) => ({
            category: group.category,
            products: facetResult[group.category.slug] || [],
        }));

        return apiSuccess(sections, 200, {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
