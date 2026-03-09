import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CommunityListing from '@/models/CommunityListing';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { auth } from '@/auth';

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/community/[id]/report — Report a listing
export async function POST(req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session?.user) return apiError('Vui lòng đăng nhập', 401);

        await dbConnect();
        const { id } = await context.params;
        const { reason } = await req.json();

        if (!reason) return apiError('Vui lòng nhập lý do báo cáo', 400);

        const listing = await CommunityListing.findById(id);
        if (!listing) return apiError('Không tìm thấy bài đăng', 404);

        const userId = (session.user as any).id;

        // Check if already reported by this user
        const alreadyReported = listing.reportedBy.some(
            (r: any) => r.user.toString() === userId
        );
        if (alreadyReported) {
            return apiError('Bạn đã báo cáo bài đăng này rồi', 400);
        }

        listing.reportedBy.push({ user: userId, reason, createdAt: new Date() } as any);
        listing.reportCount = listing.reportedBy.length;

        // Auto-hide if 5+ reports
        if (listing.reportCount >= 5) {
            listing.status = 'reported';
        }

        await listing.save();
        return apiSuccess({ message: 'Đã báo cáo bài đăng', reportCount: listing.reportCount });
    } catch (err) {
        return apiError((err as Error).message, 500);
    }
}
