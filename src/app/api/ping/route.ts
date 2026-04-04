// ============================================================
// NEXGEAR — Ping/Health Check Endpoint
// File: app/api/ping/route.ts
// Dùng để: đo latency API, warm up serverless function,
// kiểm tra MongoDB connection còn sống không.
// ============================================================
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function GET() {
    const start = Date.now()
    
    try {
        await dbConnect()
        const dbMs = Date.now() - start
        
        return NextResponse.json({
            ok: true,
            timestamp: new Date().toISOString(),
            latency: {
                db_connect_ms: dbMs,
                // < 200ms: connection đã cached (tốt)
                // 200-2000ms: kết nối mới (bình thường)
                // > 2000ms: MongoDB cold start / mạng chậm
                status: dbMs < 200 ? 'cached' : dbMs < 2000 ? 'fresh_connect' : 'slow',
            },
            region: process.env.VERCEL_REGION || 'local',
        })
    } catch (err: any) {
        return NextResponse.json({
            ok: false,
            error: err.message,
            latency_ms: Date.now() - start,
        }, { status: 500 })
    }
}
