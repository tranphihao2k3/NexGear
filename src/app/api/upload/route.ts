import { NextRequest } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { apiSuccess, apiError } from '@/lib/api-helpers';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// DELETE /api/upload — delete image from Cloudinary by public_id
export async function DELETE(req: NextRequest) {
    try {
        const { public_id } = await req.json();
        if (!public_id) return apiError('public_id is required', 400);
        const result = await cloudinary.uploader.destroy(public_id);
        return apiSuccess(result);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return apiError('No file uploaded', 400);
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        return new Promise<Response>((resolve) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'nexgear/products' },
                (error, result) => {
                    if (error) {
                        resolve(apiError(error.message, 500));
                    } else {
                        resolve(apiSuccess({ url: result?.secure_url, public_id: result?.public_id }, 200));
                    }
                }
            );
            uploadStream.end(buffer);
        });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
