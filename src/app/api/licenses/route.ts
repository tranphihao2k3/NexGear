import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import License from '@/models/License';
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';

// GET /api/licenses
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePagination(searchParams);

        const filter: Record<string, unknown> = {};

        if (searchParams.get('software')) filter.software = searchParams.get('software');
        if (searchParams.get('status')) filter.status = searchParams.get('status');

        const search = searchParams.get('search') || searchParams.get('q');
        if (search) {
            filter.$or = [
                { key: { $regex: search, $options: 'i' } },
                { hwid: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } },
                { customerPhone: { $regex: search, $options: 'i' } },
            ];
        }

        const [licenses, total] = await Promise.all([
            License.find(filter)
                .populate('software', 'title version type developer')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            License.countDocuments(filter),
        ]);

        return apiPaginated(licenses, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/licenses
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.key || !body.software || !body.expiryDate) {
            return apiError('key, software, and expiryDate are required', 400);
        }

        const existingKey = await License.findOne({ key: body.key });
        if (existingKey) return apiError('License key already exists', 400);

        const license = await License.create(body);
        return apiSuccess(license, 201);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
