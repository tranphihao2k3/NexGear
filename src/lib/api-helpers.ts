import { NextResponse } from 'next/server';

// Standard API response helpers
export function apiSuccess(data: unknown, status = 200, headers?: Record<string, string>) {
    return NextResponse.json({ success: true, data }, { status, headers });
}

export function apiError(message: string, status = 400) {
    return NextResponse.json({ success: false, error: message }, { status });
}

export function apiPaginated(
    data: unknown[],
    total: number,
    page: number,
    limit: number,
    headers?: Record<string, string>
) {
    return NextResponse.json(
        {
            success: true,
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        },
        { headers }
    );
}

// Parse query params for pagination
export function parsePagination(searchParams: URLSearchParams) {
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}
