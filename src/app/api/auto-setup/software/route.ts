import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Software from '@/models/Software';

// GET /api/auto-setup/software — Public endpoint for auto-setup tool
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);

        const filter: Record<string, unknown> = {
            autoSetup: true,
            status: 'published',
        };

        const category = searchParams.get('category');
        if (category) filter.category = category;

        const softwares = await Software.find(filter).sort({ title: 1 }).lean();

        const result = softwares.map((sw: any) => ({
            Name: sw.title,
            FileName: sw.fileName || '',
            SilentArgs: sw.silentArgs || '',
            Description: sw.excerpt || '',
            Category: sw.category || '',
            DownloadUrl: sw.downloadUrl || '',
            IsAsync: sw.isAsync ?? true,
            Password: sw.password || '',
            FileSize: sw.fileSize || '',
        }));

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 }
        );
    }
}
