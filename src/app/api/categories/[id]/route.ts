import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category';
import { invalidateCategoryCache } from '@/lib/category-cache';
import { apiSuccess, apiError } from '@/lib/api-helpers';

interface Params {
    params: Promise<{ id: string }>;
}

// GET /api/categories/[id]
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const category = await Category.findById(id).populate('parent', 'name slug').lean();
        if (!category) return apiError('Category not found', 404);
        return apiSuccess(category);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// PUT /api/categories/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();
        const category = await Category.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        }).lean();
        if (!category) return apiError('Category not found', 404);
        return apiSuccess(category);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/categories/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        const { id } = await params;
        const category = await Category.findByIdAndDelete(id);
        if (!category) return apiError('Category not found', 404);
        return apiSuccess({ message: 'Category deleted' });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
