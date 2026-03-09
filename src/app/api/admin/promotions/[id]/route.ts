import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Promotion from '@/models/Promotion';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        await dbConnect();
        const data = await request.json();

        // Optional status override logic if full payload is updated, 
        // avoiding override if we only want to change status manually
        if (data.startDate && data.endDate && (!data.status || data.status === 'draft')) {
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

        const promotion = await Promotion.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true, runValidators: true }
        );

        if (!promotion) {
            return NextResponse.json({ success: false, error: 'Không tìm thấy khuyến mãi' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: promotion, message: 'Cập nhật thành công' });
    } catch (error: any) {
        console.error('Error updating promotion:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        await dbConnect();

        const promotion = await Promotion.findByIdAndDelete(id);

        if (!promotion) {
            return NextResponse.json({ success: false, error: 'Không tìm thấy khuyến mãi' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Đã xóa chương trình khuyến mãi' });
    } catch (error) {
        console.error('Error deleting promotion:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
