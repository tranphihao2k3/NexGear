import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const user = await User.findById(id).select('-password').populate('wishlist', 'name slug images basePrice').lean();
        if (!user) return apiError('User not found', 404);
        return apiSuccess(user);
    } catch (error) { return apiError((error as Error).message, 500); }
}

export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();
        // Don't allow password update through this endpoint
        delete body.password;
        const user = await User.findByIdAndUpdate(id, body, { new: true, runValidators: true }).select('-password').lean();
        if (!user) return apiError('User not found', 404);
        return apiSuccess(user);
    } catch (error) { return apiError((error as Error).message, 500); }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const user = await User.findByIdAndDelete(id);
        if (!user) return apiError('User not found', 404);
        return apiSuccess({ message: 'User deleted' });
    } catch (error) { return apiError((error as Error).message, 500); }
}
