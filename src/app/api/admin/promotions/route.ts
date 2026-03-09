import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Promotion from '@/models/Promotion';

export async function GET(request: Request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const status = searchParams.get('status');

        let query: any = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } }
            ];
        }

        if (status) {
            query.status = status;
        }

        const promotions = await Promotion.find(query).sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: promotions });
    } catch (error) {
        console.error('Error fetching promotions:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const data = await request.json();

        // Calculate status based on dates if not explicitly provided or if draft
        if (!data.status || data.status === 'draft') {
            const now = new Date();
            const start = new Date(data.startDate);
            const end = new Date(data.endDate);

            if (now < start) {
                data.status = 'scheduled';
            } else if (now >= start && now <= end) {
                data.status = 'active';
            } else {
                data.status = 'expired';
            }
        }

        const promotion = await Promotion.create(data);

        return NextResponse.json({ success: true, data: promotion, message: 'Tạo khuyến mãi thành công' });
    } catch (error: any) {
        console.error('Error creating promotion:', error);
        if (error.code === 11000) {
            return NextResponse.json({ success: false, error: 'Mã khuyến mãi đã tồn tại' }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
