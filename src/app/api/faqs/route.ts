import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FAQ from '@/models/FAQ';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/faqs
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        if (searchParams.get('category')) filter.category = searchParams.get('category');

        if (searchParams.get('isActive') === 'true') {
            filter.isActive = true;
        } else if (searchParams.get('isActive') === 'false') {
            filter.isActive = false;
        }

        const search = searchParams.get('search') || searchParams.get('q');
        if (search) {
            filter.$or = [
                { question: { $regex: search, $options: 'i' } },
                { answer: { $regex: search, $options: 'i' } },
            ];
        }

        const [faqs, total] = await Promise.all([
            FAQ.find(filter)
                .sort({ category: 1, order: 1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            FAQ.countDocuments(filter),
        ]);

        return apiPaginated(faqs, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/faqs
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.question || !body.answer) {
            return apiError('question and answer are required', 400);
        }

        const faq = await FAQ.create(body);
        return apiSuccess(faq, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
