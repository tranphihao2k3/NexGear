import dbConnect from './src/lib/mongodb';
import Setting from './src/models/Setting';
import mongoose from 'mongoose';
import { loadEnvConfig } from '@next/env';

async function migrate() {
    loadEnvConfig(process.cwd());
    console.log('Connecting to MongoDB...', process.env.MONGODB_URI);
    await dbConnect();
    console.log('Connected. Starting migration...');

    const result = await mongoose.connection.collection('settings').updateMany(
        { $or: [{ siteId: { $exists: false } }, { siteId: null }] },
        { $set: { siteId: 'nexgear' } }
    );

    console.log(`Updated ${result.modifiedCount} settings documents (matched ${result.matchedCount}).`);
    mongoose.disconnect();
    console.log('Migration complete.');
}

migrate().catch(console.error);
