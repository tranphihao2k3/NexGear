import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import InstallmentPlan from '@/models/InstallmentPlan';
import { apiSuccess, apiError } from '@/lib/api-helpers';

// GET /api/installments?provider=HD+SAISON&active=true
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const filter: Record<string, unknown> = {};

        const provider = searchParams.get('provider');
        const active = searchParams.get('active');
        if (provider) filter.provider = provider;
        if (active === 'true') filter.isActive = true;

        const plans = await InstallmentPlan.find(filter).sort({ provider: 1, term: 1 }).lean();
        return apiSuccess(plans);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// POST /api/installments — upsert a plan (provider + term)
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        const { provider, term, entries, note, isActive } = body;

        if (!provider || !term) return apiError('provider and term are required');

        const plan = await InstallmentPlan.findOneAndUpdate(
            { provider, term },
            { provider, term, entries: entries || [], note: note || '', isActive: isActive !== false },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return apiSuccess(plan);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}

// DELETE /api/installments?id=xxx
export async function DELETE(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return apiError('id is required');

        await InstallmentPlan.findByIdAndDelete(id);
        return apiSuccess({ deleted: true });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
