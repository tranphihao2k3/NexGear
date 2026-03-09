import { NextRequest, NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';
import { getCorsHeaders, validateApiKey, corsResponse } from '@/lib/cors';

const { auth } = NextAuth(authConfig);

export default auth((req: any) => {
    const { pathname, origin } = req.nextUrl;
    const requestOrigin = req.headers.get('origin');

    // 1. Handle API routes (CORS & API Key)
    if (pathname.startsWith('/api/')) {
        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
            return corsResponse(requestOrigin);
        }

        // Validate API key for cross-origin requests
        if (requestOrigin && requestOrigin !== origin) {
            if (!validateApiKey(req)) {
                return NextResponse.json(
                    { success: false, error: 'Invalid API key' },
                    { status: 401 }
                );
            }
        }

        const response = NextResponse.next();
        const corsHeaders = getCorsHeaders(requestOrigin);
        for (const [key, value] of Object.entries(corsHeaders)) {
            response.headers.set(key, value);
        }
        return response;
    }

    // 2. Handle Admin routes (Authentication)
    if (pathname.startsWith('/admin')) {
        const user = req.auth?.user as any;

        if (!user) {
            const loginUrl = new URL('/login', req.nextUrl);
            loginUrl.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(loginUrl);
        }

        const role = user.role as string | undefined;
        if (role === 'customer') {
            return NextResponse.redirect(new URL('/', req.nextUrl));
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
