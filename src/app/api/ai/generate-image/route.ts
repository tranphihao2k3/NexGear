import { NextResponse } from 'next/server';

const IMAGE_SERVER_URL = process.env.NEXT_PUBLIC_IMAGE_SERVER_URL || 'http://hard-mauve-chihuahua.202-92-4-12.cpanel.site';
const IMAGE_SERVER_KEY = process.env.IMAGE_SERVER_KEY || '';

export async function POST(request: Request) {
    try {
        const { prompt } = await request.json();

        if (!prompt) {
            return NextResponse.json({ success: false, error: 'Vui lòng nhập mô tả ảnh' }, { status: 400 });
        }

        // Get a random image from picsum.photos
        const picsumRes = await fetch('https://picsum.photos/1200/630', { redirect: 'follow' });
        if (!picsumRes.ok) {
            return NextResponse.json({ success: false, error: 'Không tải được ảnh' }, { status: 500 });
        }

        const imageBuffer = await picsumRes.arrayBuffer();

        // Upload via base64 JSON — key in query string (LiteSpeed strips headers on POST)
        const base64 = Buffer.from(imageBuffer).toString('base64');
        const url = `${IMAGE_SERVER_URL}/upload-base64?api_key=${encodeURIComponent(IMAGE_SERVER_KEY)}`;

        const uploadRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image: `data:image/jpeg;base64,${base64}`,
                folder: 'ai-generated',
            }),
        });

        if (!uploadRes.ok) {
            const text = await uploadRes.text();
            return NextResponse.json({ success: false, error: `Upload thất bại: ${text}` }, { status: 500 });
        }

        const data = await uploadRes.json();
        const imgUrl = data.data?.[0]?.url?.replace(IMAGE_SERVER_URL, '/cdn') || '';

        if (!imgUrl) {
            return NextResponse.json({ success: false, error: 'Không nhận được URL ảnh' }, { status: 500 });
        }

        return NextResponse.json({ success: true, url: imgUrl, provider: 'picsum' });
    } catch (error: unknown) {
        console.error('[ai-generate-image]', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Lỗi tạo ảnh' },
            { status: 500 }
        );
    }
}
