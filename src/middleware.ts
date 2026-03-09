import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://laplapcantho.store',
    'https://www.laplapcantho.store',
    ...(process.env.ALLOWED_ORIGINS?.split(',') ?? []),
]

export function middleware(request: NextRequest) {
    const origin = request.headers.get('origin') ?? ''
    const isAllowed = ALLOWED_ORIGINS.includes(origin)

    // ✅ Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': isAllowed ? origin : '',
                'Access-Control-Allow-Methods': 'GET,DELETE,PATCH,POST,PUT,OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
                'Access-Control-Max-Age': '86400', // cache preflight 24h
            },
        })
    }

    const response = NextResponse.next()

    // ✅ Chỉ set origin nếu nằm trong whitelist
    if (isAllowed) {
        response.headers.set('Access-Control-Allow-Origin', origin)
        response.headers.set('Vary', 'Origin')
    }

    return response
}

export const config = {
    matcher: '/api/:path*',
}
