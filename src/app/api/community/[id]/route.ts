import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CommunityListing from '@/models/CommunityListing';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { auth } from '@/auth';
import mongoose from 'mongoose';

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/community/[id] — Get by id or slug + increment views
export async function GET(req: NextRequest, context: RouteContext) {
    try {
        await dbConnect();
        const { id } = await context.params;

        const isObjectId = mongoose.Types.ObjectId.isValid(id);
        const filter = isObjectId ? { _id: id } : { slug: id };

        const listing = await CommunityListing.findOneAndUpdate(
            filter,
            { $inc: { views: 1 } },
            { new: true }
        )
            .populate('seller', 'name image')
            .lean();

        if (!listing) return apiError('Không tìm thấy bài đăng', 404);

        return apiSuccess(listing);
    } catch (err) {
        return apiError((err as Error).message, 500);
    }
}

// PUT /api/community/[id] — Update (owner only)
export async function PUT(req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session?.user) return apiError('Vui lòng đăng nhập', 401);

        await dbConnect();
        const { id } = await context.params;
        const body = await req.json();

        const listing = await CommunityListing.findById(id);
        if (!listing) return apiError('Không tìm thấy bài đăng', 404);

        if (listing.seller.toString() !== (session.user as any).id) {
            return apiError('Bạn không có quyền sửa bài đăng này', 403);
        }

        const allowed = ['title', 'category', 'condition', 'price', 'description', 'images', 'contact', 'location', 'status'];
        for (const key of allowed) {
            if (body[key] !== undefined) {
                (listing as any)[key] = body[key];
            }
        }

        if (body.images && body.images.length > 5) {
            return apiError('Tối đa 5 hình ảnh', 400);
        }

        await listing.save();
        return apiSuccess(listing);
    } catch (err) {
        return apiError((err as Error).message, 500);
    }
}

// DELETE /api/community/[id] — Delete (owner or admin)
export async function DELETE(req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session?.user) return apiError('Vui lòng đăng nhập', 401);

        await dbConnect();
        const { id } = await context.params;

        const listing = await CommunityListing.findById(id);
        if (!listing) return apiError('Không tìm thấy bài đăng', 404);

        const userId = (session.user as any).id;
        const userRole = (session.user as any).role;
        if (listing.seller.toString() !== userId && userRole !== 'admin') {
            return apiError('Bạn không có quyền xóa bài đăng này', 403);
        }

        await CommunityListing.findByIdAndDelete(id);
        return apiSuccess({ message: 'Đã xóa bài đăng' });
    } catch (err) {
        return apiError((err as Error).message, 500);
    }
}
