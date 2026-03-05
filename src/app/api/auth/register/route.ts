import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { apiSuccess, apiError } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return apiError('Vui lòng điền đầy đủ thông tin', 400);
        }

        if (password.length < 6) {
            return apiError('Mật khẩu tối thiểu 6 ký tự', 400);
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return apiError('Email đã được sử dụng', 409);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'customer',
        });

        return apiSuccess({ id: user._id, name: user.name, email: user.email }, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
