import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import InstallmentPlan from '@/models/InstallmentPlan';
import { apiSuccess, apiError } from '@/lib/api-helpers';

// POST /api/installments/import — upload Excel file
// Excel format: first column = loan amounts, remaining columns = monthly payments per term
// First row header: "Khoản vay" | "6 tháng" | "9 tháng" | "12 tháng" ...
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const provider = formData.get('provider') as string;

        if (!file || !provider) return apiError('file and provider are required');

        // Dynamic import: xlsx (~600 KB) tách thành chunk riêng, không bundle vào worker chính
        const XLSX = await import('xlsx');

        const buffer = Buffer.from(await file.arrayBuffer());
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (rows.length < 2) return apiError('File phải có ít nhất header và 1 dòng dữ liệu');

        const headerRow = rows[0] as string[];
        // Parse terms from headers like "6 tháng", "6", "9 tháng" etc
        const terms: number[] = [];
        for (let i = 1; i < headerRow.length; i++) {
            const match = String(headerRow[i]).match(/\d+/);
            if (match) terms.push(Number(match[0]));
        }

        if (terms.length === 0) return apiError('Không tìm thấy kỳ hạn trong header');

        // Build entries per term
        const termEntries: Record<number, { loanAmount: number; monthly: number }[]> = {};
        for (const t of terms) termEntries[t] = [];

        for (let r = 1; r < rows.length; r++) {
            const row = rows[r] as (string | number)[];
            const loanAmount = Number(String(row[0]).replace(/\D/g, ''));
            if (!loanAmount || loanAmount <= 0) continue;

            for (let c = 0; c < terms.length; c++) {
                const val = row[c + 1];
                const monthly = Number(String(val || '').replace(/\D/g, ''));
                if (monthly > 0) {
                    termEntries[terms[c]].push({ loanAmount, monthly });
                }
            }
        }

        // Upsert each term
        const results = [];
        for (const term of terms) {
            if (termEntries[term].length === 0) continue;
            const plan = await InstallmentPlan.findOneAndUpdate(
                { provider, term },
                {
                    provider,
                    term,
                    entries: termEntries[term].sort((a, b) => a.loanAmount - b.loanAmount),
                    isActive: true,
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            results.push(plan);
        }

        return apiSuccess({ imported: results.length, terms, provider });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
