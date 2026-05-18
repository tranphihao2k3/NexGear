import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ScanSession from '@/models/ScanSession';
import Pusher from 'pusher';

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    useTLS: true,
});

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const { token } = await req.json();

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Missing token' },
                { status: 400 }
            );
        }

        const session = await ScanSession.findOne({ token });

        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Invalid token' },
                { status: 401 }
            );
        }

        if (new Date() > session.expiresAt) {
            return NextResponse.json(
                { success: false, error: 'Token expired' },
                { status: 401 }
            );
        }

        // Trigger event realtime báo cho browser biết exe đã mở
        await pusher.trigger(`scan-${token}`, 'exe-opened', {
            status: 'connected',
            timestamp: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            message: 'Handshake successful',
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
