import Category from '@/models/Category';

/**
 * In-memory cache for Category lookups.
 * Avoids repeated Category.findOne({ slug }) + Category.find({ parent }) per request.
 * TTL: 5 minutes — categories rarely change.
 */

interface CachedCategory {
    _id: any;
    name: string;
    slug: string;
    parent: any;
    isActive: boolean;
}

interface CategoryCache {
    bySlug: Map<string, CachedCategory>;
    childrenOf: Map<string, CachedCategory[]>;
    timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let cache: CategoryCache | null = null;

async function ensureCache(): Promise<CategoryCache> {
    const now = Date.now();
    if (cache && now - cache.timestamp < CACHE_TTL) {
        return cache;
    }

    const all = await Category.find({})
        .select('_id name slug parent isActive')
        .lean() as CachedCategory[];

    const bySlug = new Map<string, CachedCategory>();
    const childrenOf = new Map<string, CachedCategory[]>();

    for (const cat of all) {
        bySlug.set(cat.slug, cat);
        if (cat.parent) {
            const parentId = cat.parent.toString();
            if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
            childrenOf.get(parentId)!.push(cat);
        }
    }

    cache = { bySlug, childrenOf, timestamp: now };
    return cache;
}

/**
 * Get a category by slug + its children IDs.
 * Returns null if not found.
 * Single DB query (cached), replaces the old pattern of:
 *   Category.findOne({ slug }) → Category.find({ parent: cat._id })
 */
export async function getCategoryWithChildren(slug: string): Promise<{
    category: CachedCategory;
    allIds: any[];
} | null> {
    const c = await ensureCache();
    const cat = c.bySlug.get(slug);
    if (!cat) return null;

    const children = c.childrenOf.get(cat._id.toString()) || [];
    const allIds = [cat._id, ...children.map(ch => ch._id)];
    return { category: cat, allIds };
}

/**
 * Get category by ID.
 */
export async function getCategoryById(id: string): Promise<CachedCategory | null> {
    const c = await ensureCache();
    for (const cat of c.bySlug.values()) {
        if (cat._id.toString() === id) return cat;
    }
    return null;
}

/**
 * Get all active root categories with children (tree format).
 */
export async function getCategoryTree(): Promise<any[]> {
    const c = await ensureCache();
    const roots: any[] = [];
    for (const cat of c.bySlug.values()) {
        if (!cat.parent && cat.isActive) {
            const children = (c.childrenOf.get(cat._id.toString()) || [])
                .filter(ch => ch.isActive);
            roots.push({
                ...cat,
                children,
            });
        }
    }
    return roots;
}

/**
 * Invalidate the cache (call after category CRUD operations).
 */
export function invalidateCategoryCache() {
    cache = null;
}
