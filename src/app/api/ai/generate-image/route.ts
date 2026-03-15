import { NextResponse } from 'next/server';
import crypto from 'crypto';

function generateSignature(params: Record<string, string>, apiSecret: string): string {
    const sortedKeys = Object.keys(params).sort();
    const str = sortedKeys.map(k => `${k}=${params[k]}`).join('&');
    return crypto.createHash('sha1').update(str + apiSecret).digest('hex');
}

export async function POST(request: Request) {
    try {
        const { prompt } = await request.json();

        if (!prompt) {
            return NextResponse.json({ success: false, error: 'Vui lòng nhập mô tả ảnh' }, { status: 400 });
        }

        // Step 1: Get a random image from picsum.photos (always works, no API key)
        const picsumRes = await fetch('https://picsum.photos/1200/630', { redirect: 'follow' });
        if (!picsumRes.ok) {
            return NextResponse.json({ success: false, error: 'Không tải được ảnh' }, { status: 500 });
        }

        const imageBuffer = Buffer.from(await picsumRes.arrayBuffer());
        const base64 = imageBuffer.toString('base64');
        const dataUri = `data:image/jpeg;base64,${base64}`;

        // Step 2: Upload to Cloudinary (signed upload)
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (cloudName && apiKey && apiSecret) {
            try {
                const timestamp = Math.round(Date.now() / 1000).toString();
                const params: Record<string, string> = {
                    folder: 'blog',
                    timestamp,
                };
                const signature = generateSignature(params, apiSecret);

                const formData = new FormData();
                formData.append('file', dataUri);
                formData.append('folder', 'blog');
                formData.append('timestamp', timestamp);
                formData.append('api_key', apiKey);
                formData.append('signature', signature);

                const uploadRes = await fetch(
                    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                    { method: 'POST', body: formData }
                );

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    return NextResponse.json({ success: true, url: uploadData.secure_url, provider: 'picsum+cloudinary' });
                } else {
                    console.error('Cloudinary error:', await uploadRes.text());
                }
            } catch (e) {
                console.error('Cloudinary upload failed:', e);
            }
        }

        // Fallback: return base64
        return NextResponse.json({ success: true, url: dataUri, provider: 'picsum' });
    } catch (error: any) {
        console.error('[ai-generate-image]', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Lỗi tạo ảnh' },
            { status: 500 }
        );
    }
}
