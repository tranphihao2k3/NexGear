import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import ScanSession from '@/models/ScanSession';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await ScanSession.create({
            token,
            expiresAt,
            status: 'pending',
        });

        return NextResponse.json({
            success: true,
            data: {
                token,
                downloadUrl: '/scan-agent.exe',
                expiresAt,
            },
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
