import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-helpers';

const IMAGE_SERVER_URL = process.env.NEXT_PUBLIC_IMAGE_SERVER_URL || 'http://hard-mauve-chihuahua.202-92-4-12.cpanel.site';
const IMAGE_SERVER_KEY = process.env.IMAGE_SERVER_KEY || '';

// Convert absolute cPanel URL to /cdn/ proxy path
function toCdnUrl(url: string): string {
    if (!url) return url;
    return url.replace(IMAGE_SERVER_URL, '/cdn');
}

// DELETE /api/upload — delete image(s) from external server
export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();

        // Support single: { filename } or multi: { filenames: [...] }
        const filenames: string[] = body.filenames
            ? body.filenames.map((f: string) => f.split('/').pop() || f)
            : body.filename
                ? [body.filename.split('/').pop() || body.filename]
                : [];

        if (filenames.length === 0) return apiError('filename hoặc filenames is required', 400);

        if (filenames.length === 1) {
            // Single delete
            const res = await fetch(`${IMAGE_SERVER_URL}/images/${filenames[0]}`, {
                method: 'DELETE',
                headers: { 'X-API-Key': IMAGE_SERVER_KEY },
            });
            if (!res.ok) {
                const text = await res.text();
                return apiError(`Xóa ảnh thất bại: ${text}`, res.status);
            }
            return apiSuccess({ deleted: filenames[0] });
        }

        // Multi delete — key via query string (LiteSpeed strips headers on POST)
        const res = await fetch(`${IMAGE_SERVER_URL}/delete-multiple?api_key=${encodeURIComponent(IMAGE_SERVER_KEY)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filenames }),
        });

        if (!res.ok) {
            const text = await res.text();
            return apiError(`Xóa ảnh thất bại: ${text}`, res.status);
        }

        const data = await res.json();
        return apiSuccess(data);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/upload — proxy upload to external image server via base64
// API key sent via query string to bypass LiteSpeed stripping X-API-Key on POST
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const folder = formData.get('folder') as string | null;

        // Support single file or multiple files
        const files: File[] = [];
        if (file) {
            files.push(file);
        }
        // Check both "files" and "files[]" (client sends files[])
        for (const key of ['files', 'files[]']) {
            for (const f of formData.getAll(key)) {
                if (f instanceof File) files.push(f);
            }
        }

        if (files.length === 0) {
            return apiError('No file uploaded', 400);
        }

        // Validate all files
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        const maxSize = 10 * 1024 * 1024;

        for (const f of files) {
            if (!allowedTypes.includes(f.type)) {
                return apiError(`Chỉ chấp nhận file ảnh (JPEG, PNG, WebP, GIF): ${f.name}`, 400);
            }
            if (f.size > maxSize) {
                return apiError(`File quá lớn (tối đa 10MB): ${f.name}`, 400);
            }
        }

        // Convert files to base64
        const images = await Promise.all(
            files.map(async (f) => {
                const bytes = await f.arrayBuffer();
                const base64 = Buffer.from(bytes).toString('base64');
                return {
                    data: `data:${f.type || 'image/jpeg'};base64,${base64}`,
                    folder: folder || '',
                };
            })
        );

        const jsonBody = images.length === 1
            ? { image: images[0].data, folder: images[0].folder }
            : { images };

        // Key via query string — LiteSpeed strips headers on POST but query params pass through
        const url = `${IMAGE_SERVER_URL}/upload-base64?api_key=${encodeURIComponent(IMAGE_SERVER_KEY)}`;

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jsonBody),
        });

        if (!res.ok) {
            const text = await res.text();
            return apiError(`Upload thất bại: ${text}`, res.status);
        }

        const data = await res.json();

        if (data.data && data.data.length > 0) {
            if (files.length === 1) {
                return apiSuccess({ url: toCdnUrl(data.data[0].url), filename: data.data[0].name });
            }
            return apiSuccess({
                urls: data.data.map((d: { url: string }) => toCdnUrl(d.url)),
                files: data.data.map((d: { url: string; name: string }) => ({ ...d, url: toCdnUrl(d.url) })),
            });
        }

        return apiError(data.failed?.[0]?.error || 'Upload thất bại', 422);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
