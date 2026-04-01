import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';
import Brand from '@/models/Brand';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params { params: Promise<{ id: string }> }

// GET /api/products/[id] — also accepts slug
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;

        // Try ObjectId first, then slug
        const isObjectId = /^[a-f\d]{24}$/i.test(id);
        const product = isObjectId
            ? await Product.findById(id).populate('category', 'name slug').populate('brand', 'name slug logo').lean()
            : await Product.findOne({ slug: id }).populate('category', 'name slug').populate('brand', 'name slug logo').lean();

        if (!product) return apiError('Product not found', 404);
        return apiSuccess(product);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/products/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();
        const product = await Product.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        })
            .populate('category', 'name slug')
            .populate('brand', 'name slug logo')
            .lean();
        if (!product) return apiError('Product not found', 404);
        return apiSuccess(product);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/products/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const product = await Product.findByIdAndDelete(id);
        if (!product) return apiError('Product not found', 404);

        // Collect all image URLs (product + variants)
        const allImages: string[] = [
            ...(product.images || []),
            ...(product.variants || []).flatMap((v: { images?: string[] }) => v.images || []),
        ];

        // Delete images from image server in background
        if (allImages.length > 0) {
            const origin = req.nextUrl.origin;
            fetch(`${origin}/api/upload`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filenames: allImages }),
            }).catch(() => {}); // fire and forget
        }

        return apiSuccess({ message: 'Product deleted' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
