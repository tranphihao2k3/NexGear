import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { FacebookGroup } from '@/models';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { auth } from '@/auth';

// GET /api/admin/facebook-groups — List all groups
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user || (session.user as any).role !== 'admin') {
            return apiError('Unauthorized', 401);
        }

        await dbConnect();
        const groups = await FacebookGroup.find().sort({ order: 1, createdAt: -1 });
        return apiSuccess(groups);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/admin/facebook-groups — Create new group
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || (session.user as any).role !== 'admin') {
            return apiError('Unauthorized', 401);
        }

        await dbConnect();
        const body = await req.json();

        if (!body.url) {
            return apiError('URL is required', 400);
        }

        // Check if group already exists
        const existing = await FacebookGroup.findOne({ url: body.url });
        if (existing) {
            return apiError('Group already exists in list', 400);
        }

        const group = await FacebookGroup.create(body);
        return apiSuccess(group, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
