import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { verifyToken, extractTokenFromHeader } from '@/lib/jwt';

/**
 * GET /api/auth/me
 * Verify JWT token and return current user info
 * Used by LapLap frontend to check auth status
 *
 * Header: Authorization: Bearer <token>
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        // Extract token from Authorization header
        const authHeader = req.headers.get('authorization');
        const token = extractTokenFromHeader(authHeader);

        if (!token) {
            return apiError('No token provided', 401);
        }

        // Verify token
        const payload = verifyToken(token);
        if (!payload) {
            return apiError('Invalid or expired token', 401);
        }

        // Fetch user from DB to get current info
        const user = await User.findById(payload.userId).select('-password').lean();
        if (!user) {
            return apiError('User not found', 404);
        }

        return apiSuccess({
            token,
            user,
        }, 200);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
