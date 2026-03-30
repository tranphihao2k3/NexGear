import 'dotenv/config';
import mongoose from 'mongoose';

async function migrate() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected. Starting migration...');

    // Find documents without siteId or with siteId equals to null
    const Setting = mongoose.model('Setting', new mongoose.Schema({ siteId: String }, { strict: false }), 'settings');

    const result = await Setting.updateMany(
        { $or: [{ siteId: { $exists: false } }, { siteId: null }] },
        { $set: { siteId: 'nexgear' } }
    );

    console.log(`Updated ${result.modifiedCount} settings documents (matched ${result.matchedCount}).`);
    mongoose.disconnect();
    console.log('Migration complete.');
}

migrate().catch(console.error);
