/**
 * Seed sub-categories for all parent categories.
 * Run: npx tsx src/scripts/seed-subcategories.ts
 * Idempotent — uses upsert by slug.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('MONGODB_URI not set');
    process.exit(1);
}

const CategorySchema = new mongoose.Schema({
    name: String,
    slug: { type: String, unique: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    icon: { type: String, default: '' },
    image: { type: String, default: '' },
    description: { type: String, default: '' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
}, { timestamps: true });

const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

interface SubCat {
    slug: string;
    name: string;
    description?: string;
    order?: number;
}

const SUBCATEGORIES: Record<string, SubCat[]> = {
    laptop: [
        { slug: 'gaming-laptop', name: 'Gaming Laptop', description: 'Laptop hiệu năng cao cho game', order: 1 },
        { slug: 'ultrabook', name: 'Ultrabook', description: 'Mỏng nhẹ, thời trang', order: 2 },
        { slug: 'workstation', name: 'Workstation', description: 'Đồ họa, lập trình chuyên nghiệp', order: 3 },
        { slug: 'laptop-sinh-vien', name: 'Laptop Sinh Viên', description: 'Giá tốt, phù hợp học tập', order: 4 },
    ],
    chuot: [
        { slug: 'chuot-gaming', name: 'Chuột Gaming', description: 'Chuột chơi game chuyên nghiệp', order: 1 },
        { slug: 'chuot-wireless', name: 'Chuột Wireless', description: 'Không dây, tự do di chuyển', order: 2 },
        { slug: 'chuot-ergonomic', name: 'Chuột Ergonomic', description: 'Thiết kế công thái học', order: 3 },
        { slug: 'chuot-sieu-nhe', name: 'Chuột Siêu Nhẹ', description: 'Dưới 60g, linh hoạt tối đa', order: 4 },
    ],
    'ban-phim': [
        { slug: 'ban-phim-co', name: 'Bàn Phím Cơ', description: 'Mechanical keyboard cao cấp', order: 1 },
        { slug: 'ban-phim-khong-day', name: 'Bàn Phím Không Dây', description: 'Wireless & Bluetooth', order: 2 },
        { slug: 'ban-phim-tkl', name: 'Bàn Phím TKL / 75%', description: 'Compact, tiết kiệm không gian', order: 3 },
        { slug: 'ban-phim-60', name: 'Bàn Phím 60% / 65%', description: 'Ultra compact, tối giản', order: 4 },
        { slug: 'custom-kit', name: 'Custom Kit', description: 'Barebone & DIY kit', order: 5 },
    ],
    'tai-nghe': [
        { slug: 'tai-nghe-over-ear', name: 'Tai Nghe Over-ear', description: 'Trùm tai, bass sâu', order: 1 },
        { slug: 'tai-nghe-in-ear', name: 'Tai Nghe In-ear / TWS', description: 'True wireless stereo', order: 2 },
        { slug: 'tai-nghe-gaming', name: 'Tai Nghe Gaming', description: 'Âm thanh vòm 7.1', order: 3 },
    ],
    loa: [
        { slug: 'soundbar', name: 'Soundbar', description: 'Loa thanh cho bàn setup', order: 1 },
        { slug: 'loa-bluetooth', name: 'Loa Bluetooth', description: 'Di động, pin lâu', order: 2 },
        { slug: 'loa-desktop', name: 'Loa Desktop', description: '2.0 / 2.1 cho PC', order: 3 },
    ],
    'phu-kien': [
        { slug: 'keycap', name: 'Keycap Sets', description: 'PBT, Cherry profile...', order: 1 },
        { slug: 'switch', name: 'Switches', description: 'Gateron, Cherry MX...', order: 2 },
        { slug: 'mouse-pad', name: 'Mouse Pad', description: 'Desk mat & gaming pad', order: 3 },
        { slug: 'cable-hub', name: 'Cable & Hub', description: 'USB-C, Dock, Hub', order: 4 },
        { slug: 'wrist-rest', name: 'Wrist Rest', description: 'Kê tay gỗ, silicone', order: 5 },
    ],
};

async function main() {
    await mongoose.connect(MONGODB_URI!);
    console.log('Connected to MongoDB');

    let created = 0;
    let updated = 0;

    for (const [parentSlug, children] of Object.entries(SUBCATEGORIES)) {
        const parent = await Category.findOne({ slug: parentSlug });
        if (!parent) {
            console.warn(`Parent category "${parentSlug}" not found, skipping`);
            continue;
        }

        for (const child of children) {
            const result = await Category.updateOne(
                { slug: child.slug },
                {
                    $set: {
                        name: child.name,
                        parent: parent._id,
                        description: child.description || '',
                        order: child.order || 0,
                        isActive: true,
                    },
                    $setOnInsert: { slug: child.slug },
                },
                { upsert: true }
            );

            if (result.upsertedCount > 0) {
                created++;
                console.log(`  + Created: ${child.slug} (parent: ${parentSlug})`);
            } else if (result.modifiedCount > 0) {
                updated++;
                console.log(`  ~ Updated: ${child.slug}`);
            } else {
                console.log(`  = Unchanged: ${child.slug}`);
            }
        }
    }

    console.log(`\nDone! Created: ${created}, Updated: ${updated}`);
    await mongoose.disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
