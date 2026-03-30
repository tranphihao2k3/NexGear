import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
    process.env.LAPLAP_ORIGIN,
    process.env.NEXT_PUBLIC_APP_URL,
    'https://laplapcantho.store',
    'https://www.laplapcantho.store',
    'https://www.laptopthanhvo.com',
    'https://laptopthanhvo.com',
    'http://localhost:3000',
    'http://localhost:3001',
].filter(Boolean) as string[];

export function getCorsHeaders(origin: string | null) {
    const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);
    return {
        'Access-Control-Allow-Origin': isAllowed ? origin : '',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
    };
}

export function validateApiKey(request: NextRequest): boolean {
    const apiKey = request.headers.get('x-api-key');
    const secretKey = process.env.API_SECRET_KEY;
    if (!secretKey) return true; // no key configured = skip validation
    return apiKey === secretKey;
}

export function corsResponse(origin: string | null) {
    return new NextResponse(null, {
        status: 204,
        headers: getCorsHeaders(origin),
    });
}
