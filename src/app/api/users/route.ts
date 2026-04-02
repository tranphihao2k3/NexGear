import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/users
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};
        if (searchParams.get('role')) filter.role = searchParams.get('role');
        if (searchParams.get('email')) filter.email = searchParams.get('email');
        // Filter theo siteId — admin chỉ xem staff của shop mình
        if (searchParams.get('siteId')) filter.siteId = searchParams.get('siteId');

        const search = searchParams.get('q');
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(filter),
        ]);

        return apiPaginated(users, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/users — Admin create user
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.name || !body.email) return apiError('name and email are required');

        const existing = await User.findOne({ email: body.email });
        if (existing) return apiError('Email already exists');

        const user = await User.create(body);
        const userObj = user.toObject();
        delete userObj.password;
        return apiSuccess(userObj, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
