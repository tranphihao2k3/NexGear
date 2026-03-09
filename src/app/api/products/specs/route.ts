import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { normalizeSpecValues, normalizeScreenSpec, SCREEN_SPEC_KEY } from '@/lib/spec-normalize';

// GET /api/products/specs?categorySlug=ban-phim
// Returns normalized spec filters for a given category
// Response: { filters: { [filterKey]: { label, options: { normalized, rawValues[] }[] } }, rawMap: { [specKey]: rawValues[] } }
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const categorySlug = searchParams.get('categorySlug');

        if (!categorySlug) {
            return apiError('categorySlug is required');
        }

        const cat = await Category.findOne({ slug: categorySlug }).lean();
        if (!cat) {
            return apiSuccess({ filters: {}, rawMap: {} });
        }

        const results = await Product.aggregate([
            { $match: { category: cat._id, isActive: true } },
            { $project: { specs: { $objectToArray: '$specs' } } },
            { $unwind: '$specs' },
            {
                $group: {
                    _id: '$specs.k',
                    values: { $addToSet: '$specs.v' },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Raw spec map from DB
        const rawMap: Record<string, string[]> = {};
        for (const r of results) {
            const vals = r.values
                .filter((v: unknown) => typeof v === 'string' || typeof v === 'number')
                .map(String);
            if (vals.length > 0) {
                rawMap[r._id] = vals;
            }
        }

        // Build normalized filters
        const filters: Record<string, { normalized: string; rawValues: string[] }[]> = {};

        for (const [specKey, rawValues] of Object.entries(rawMap)) {
            if (specKey === SCREEN_SPEC_KEY) {
                // Màn hình → split into Kích thước + Độ phân giải
                const screenFilters = normalizeScreenSpec(rawValues);
                for (const [filterKey, normalizedMap] of Object.entries(screenFilters)) {
                    filters[filterKey] = Array.from(normalizedMap.entries())
                        .map(([normalized, raws]) => ({ normalized, rawValues: raws }))
                        .sort((a, b) => a.normalized.localeCompare(b.normalized, 'vi'));
                }
            } else {
                const normalizedMap = normalizeSpecValues(specKey, rawValues);
                filters[specKey] = Array.from(normalizedMap.entries())
                    .map(([normalized, raws]) => ({ normalized, rawValues: raws }))
                    .sort((a, b) => a.normalized.localeCompare(b.normalized, 'vi'));
            }
        }

        return apiSuccess({ filters, rawMap });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
