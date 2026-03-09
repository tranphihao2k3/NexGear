import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { generateToken } from '@/lib/jwt';

interface LoginRequest {
    email: string;
    password: string;
}

/**
 * POST /api/auth/login
 * Login with email/password, returns JWT token
 * Used by LapLap frontend for stateless authentication
 */
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body: LoginRequest = await req.json();

        // Validate input
        if (!body.email || !body.password) {
            return apiError('Email and password are required', 400);
        }

        // Find user by email
        const user = await User.findOne({ email: body.email });
        if (!user || !user.password) {
            return apiError('Invalid email or password', 401);
        }

        // Compare password
        const isValidPassword = await bcrypt.compare(body.password, user.password);
        if (!isValidPassword) {
            return apiError('Invalid email or password', 401);
        }

        // Generate JWT token
        const token = generateToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
        });

        // Return token and user info (without password)
        return apiSuccess({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image,
            },
        }, 200);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
