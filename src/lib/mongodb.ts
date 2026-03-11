import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
interface MongooseCache {
    conn: any;
    promise: Promise<any> | null;
    modelsRegistered: boolean;
}

declare global {
    var mongooseGlobalCache: MongooseCache;
}

let cached: MongooseCache = global.mongooseGlobalCache;

if (!cached) {
    cached = global.mongooseGlobalCache = { conn: null, promise: null, modelsRegistered: false };
}

/**
 * Eagerly import all models so Mongoose registers their schemas before any
 * populate() / ref resolution runs. This prevents the
 * "Schema hasn't been registered for model X" error in Vercel serverless
 * environments where each lambda may have a cold start with no prior imports.
 */
function registerModels() {
    if (cached.modelsRegistered) return;
    // Importing the barrel file registers every model in one shot
    require('@/models/index');
    cached.modelsRegistered = true;
}

async function dbConnect() {
    if (cached.conn) {
        registerModels();
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(MONGODB_URI!, opts);
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    registerModels();
    return cached.conn;
}

export default dbConnect;
