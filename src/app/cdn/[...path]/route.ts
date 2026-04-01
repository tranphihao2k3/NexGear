import { NextRequest } from 'next/server';

const IMAGE_SERVER_URL = process.env.NEXT_PUBLIC_IMAGE_SERVER_URL || 'http://hard-mauve-chihuahua.202-92-4-12.cpanel.site';

// GET /cdn/* — proxy images from cPanel with clean headers (bypass ModSecurity)
export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    const imagePath = path.join('/');

    const res = await fetch(`${IMAGE_SERVER_URL}/${imagePath}`, {
        headers: {
            'Accept': 'image/*,*/*',
        },
    });

    if (!res.ok) {
        return new Response('Image not found', { status: res.status });
    }

    const body = res.body;
    const contentType = res.headers.get('content-type') || 'image/jpeg';

    return new Response(body, {
        status: 200,
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
        },
    });
}
