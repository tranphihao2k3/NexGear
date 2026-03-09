import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import dbConnect from '@/lib/mongodb';
import CommunityListing from '@/models/CommunityListing';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';
import { auth } from '@/auth';

function slugify(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

// GET /api/community — List with filters
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        // Default: only active
        const status = searchParams.get('status') || 'active';
        if (status !== 'all') filter.status = status;

        if (searchParams.get('category')) filter.category = searchParams.get('category');
        if (searchParams.get('condition')) filter.condition = searchParams.get('condition');

        const sellerParam = searchParams.get('seller');
        if (sellerParam) {
            if (sellerParam === 'me') {
                const session = await auth();
                if (session?.user?.id) {
                    filter.seller = session.user.id;
                    // When viewing own listings, show all statuses by default
                    if (!searchParams.get('status')) delete filter.status;
                }
            } else {
                filter.seller = sellerParam;
            }
        }

        const search = searchParams.get('search');
        if (search) filter.$text = { $search: search };

        // Price range
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        if (minPrice || maxPrice) {
            filter.price = {} as Record<string, number>;
            if (minPrice) (filter.price as Record<string, number>).$gte = Number(minPrice);
            if (maxPrice) (filter.price as Record<string, number>).$lte = Number(maxPrice);
        }

        // Sort
        const sortBy = searchParams.get('sort') || '-createdAt';
        const sortMap: Record<string, string> = {
            '-createdAt': '-createdAt',
            'price': 'price',
            '-price': '-price',
            '-views': '-views',
        };
        const sort = sortMap[sortBy] || '-createdAt';

        const [data, total] = await Promise.all([
            CommunityListing.find(filter)
                .populate('seller', 'name image')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            CommunityListing.countDocuments(filter),
        ]);

        return apiPaginated(data, total, page, limit);
    } catch (err) {
        return apiError((err as Error).message, 500);
    }
}

// POST /api/community — Create listing
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) return apiError('Vui lòng đăng nhập', 401);

        await dbConnect();
        const body = await req.json();

        const { title, category, condition, price, description, images, contact, location } = body;

        if (!title || !category || !condition || !price || !description) {
            return apiError('Vui lòng điền đầy đủ thông tin', 400);
        }

        if (images && images.length > 5) {
            return apiError('Tối đa 5 hình ảnh', 400);
        }

        const slug = `${slugify(title)}-${nanoid(8)}`;

        const listing = await CommunityListing.create({
            title,
            slug,
            seller: (session.user as any).id,
            category,
            condition,
            price: Number(price),
            description,
            images: images || [],
            contact: contact || {},
            location: location || '',
        });

        return apiSuccess(listing, 201);
    } catch (err) {
        return apiError((err as Error).message, 500);
    }
}
