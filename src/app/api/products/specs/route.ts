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

        // Lấy tất cả sub-categories (children) để bao gồm sản phẩm trong sub-cats
        const subCats = await Category.find({ parent: cat._id, isActive: true }).lean();
        const catIds = [cat._id, ...subCats.map((c: any) => c._id)];

        const results = await Product.aggregate([
            { $match: { category: { $in: catIds }, isActive: true } },
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

        // Alias map: nhiều key DB khác nhau nhưng cùng ý nghĩa → gom vào 1 canonical key
        // Ví dụ: "Card đồ họa" và "GPU" đều là GPU, "SSD"/"HDD" đều là "Ổ cứng"
        const SPEC_KEY_ALIASES: Record<string, string> = {
            'Card đồ họa': 'GPU',
            'SSD': 'Ổ cứng',
            'HDD': 'Ổ cứng',
        };

        // Raw spec map from DB (gom alias về canonical key)
        const rawMap: Record<string, string[]> = {};
        for (const r of results) {
            const vals = r.values
                .filter((v: unknown) => typeof v === 'string' || typeof v === 'number')
                .map(String);
            if (vals.length === 0) continue;
            // Map alias → canonical key
            const canonicalKey = SPEC_KEY_ALIASES[r._id] ?? r._id;
            if (!rawMap[canonicalKey]) rawMap[canonicalKey] = [];
            // Merge values (tránh trùng lặp)
            for (const v of vals) {
                if (!rawMap[canonicalKey].includes(v)) rawMap[canonicalKey].push(v);
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
