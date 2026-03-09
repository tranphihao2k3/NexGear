import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { FacebookGroup } from '@/models';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { auth } from '@/auth';

// DELETE /api/admin/facebook-groups/[id] — Remove group
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user || (session.user as any).role !== 'admin') {
            return apiError('Unauthorized', 401);
        }

        await dbConnect();
        const group = await FacebookGroup.findByIdAndDelete(id);
        if (!group) {
            return apiError('Group not found', 404);
        }

        return apiSuccess({ message: 'Group deleted successfully' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
