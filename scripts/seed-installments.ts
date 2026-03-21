/* eslint-disable */
// Run: npx tsx scripts/seed-installments.ts

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI!;

const InstallmentPlanSchema = new mongoose.Schema({
    provider: String,
    term: Number,
    entries: [{ loanAmount: Number, monthly: Number, _id: false }],
    note: String,
    isActive: Boolean,
}, { timestamps: true });

InstallmentPlanSchema.index({ provider: 1, term: 1 }, { unique: true });
const InstallmentPlan = mongoose.models.InstallmentPlan || mongoose.model('InstallmentPlan', InstallmentPlanSchema);

// MCredit data: terms 6,9,12,15,18,21,24
const MCREDIT_AMOUNTS = [5,6,7,8,9,10,11,12,13,14,15,20].map(n => n * 1_000_000);
const MCREDIT_RAW: Record<number, number[]> = {
    6:  [1023000,1226000,1429000,1631000,1833000,2034000,2238000,2440000,2643000,2845000,3045000,4056000],
    9:  [727000,870000,1013000,1156000,1299000,1442000,1585000,1728000,1871000,2014000,2156000,2871000],
    12: [580000,693000,807000,920000,1033000,1148000,1260000,1374000,1487000,1601000,1715000,2283000],
    15: [493000,588000,648000,780000,876000,973000,1068000,1164000,1259000,1355000,1453000,1933000],
    18: [435000,519000,603000,688000,772000,858000,941000,1025000,1110000,1194000,1280000,1703000],
    21: [395000,470000,546000,623000,699000,777000,852000,928000,1004000,1080000,1159000,1541000],
    24: [365000,434000,505000,575000,645000,717000,786000,856000,926000,997000,1069000,1422000],
};

// HD SAISON data: terms 6,9,12
const HDSAISON_AMOUNTS = [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30].map(n => n * 1_000_000);
const HDSAISON_RAW: Record<number, (number|null)[]> = {
    6:  [411000,610000,809000,1008000,1207000,1406000,1605000,1804000,2003000,2202000,2401000,2600000,2799000,2998000,3198000,3397000,3596000,3795000,3994000,4193000,4392000,4591000,4790000,4989000,5188000,5387000,5586000,5785000,5984000],
    9:  [291000,430000,569000,709000,848000,987000,1126000,1265000,1405000,1544000,1683000,1822000,1961000,2101000,2240000,2379000,2518000,2658000,2797000,2936000,3075000,3214000,3354000,3493000,3632000,3771000,3910000,4050000,4189000],
    12: [null,null,458000,569000,680000,792000,903000,1014000,1126000,1237000,1348000,1460000,1571000,1682000,1794000,1905000,2016000,2128000,2239000,2350000,2462000,2573000,2684000,2796000,2907000,3018000,3130000,3241000,3352000],
};

async function seed() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Seed MCredit
    for (const [termStr, monthlies] of Object.entries(MCREDIT_RAW)) {
        const term = Number(termStr);
        const entries = MCREDIT_AMOUNTS.map((amt, i) => ({ loanAmount: amt, monthly: monthlies[i] }));
        await InstallmentPlan.findOneAndUpdate(
            { provider: 'MCredit', term },
            { provider: 'MCredit', term, entries, note: '', isActive: true },
            { upsert: true, new: true }
        );
        console.log(`MCredit ${term} tháng — ${entries.length} mức`);
    }

    // Seed HD SAISON
    for (const [termStr, monthlies] of Object.entries(HDSAISON_RAW)) {
        const term = Number(termStr);
        const entries = HDSAISON_AMOUNTS
            .map((amt, i) => monthlies[i] ? { loanAmount: amt, monthly: monthlies[i]! } : null)
            .filter(Boolean) as { loanAmount: number; monthly: number }[];
        await InstallmentPlan.findOneAndUpdate(
            { provider: 'HD SAISON', term },
            { provider: 'HD SAISON', term, entries, note: '', isActive: true },
            { upsert: true, new: true }
        );
        console.log(`HD SAISON ${term} tháng — ${entries.length} mức`);
    }

    console.log('\nDone! Seeded MCredit (7 terms) + HD SAISON (3 terms)');
    await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
