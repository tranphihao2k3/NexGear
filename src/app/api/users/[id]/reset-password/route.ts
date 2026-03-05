import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        if (!body.password || body.password.length < 6) {
            return apiError('Password must be at least 6 characters');
        }

        const user = await User.findById(id);
        if (!user) return apiError('User not found', 404);

        // Store password directly (in production, hash with bcrypt)
        user.password = body.password;
        await user.save();

        return apiSuccess({ message: 'Password reset successfully' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
