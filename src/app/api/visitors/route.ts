import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Visitor from '@/models/Visitor';
import { apiSuccess, apiError, apiPaginated } from '@/lib/api-helpers';

// GET /api/visitors - list all visitors with pagination and search
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);

        // Single label mode (original)
        const labelParam = searchParams.get('label');
        if (labelParam && !searchParams.has('page')) {
            const visitor = await Visitor.findOne({ label: labelParam }).lean();
            if (!visitor) return apiSuccess({ count: 0, label: labelParam });
            return apiSuccess(visitor);
        }

        // List mode (new)
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const skip = (page - 1) * limit;

        const query: any = {};
        if (search) {
            query.$or = [
                { label: { $regex: search, $options: 'i' } },
                { ipAddress: { $regex: search, $options: 'i' } }
            ];
        }

        const [visitors, total] = await Promise.all([
            Visitor.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
            Visitor.countDocuments(query)
        ]);

        return apiPaginated(visitors, total, page, limit);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/visitors - increment or create visitor
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        const { label, ipAddress, userAgent, isNewLabel } = body;

        if (isNewLabel) {
            // Manual creation from admin
            const visitor = await Visitor.create({
                label,
                ipAddress,
                userAgent,
                count: 1
            });
            return apiSuccess(visitor);
        }

        // Increment count atomically (from client track)
        const visitor = await Visitor.findOneAndUpdate(
            { label: label || 'total_visitors' },
            { $inc: { count: 1 } },
            { upsert: true, new: true }
        ).lean();

        return apiSuccess(visitor);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
