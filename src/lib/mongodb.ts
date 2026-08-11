import mongoose from 'mongoose';

/**
 * ⚠️ KHÔNG throw ở top-level khi build — Cloudflare Workers build sẽ fail
 * ở route /_not-found nếu throw lúc module evaluation.
 *  Thay vào đó, kiểm tra lúc gọi dbConnect() thật sự.
 */
const MONGODB_URI = process.env.MONGODB_URI;

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
    if (!MONGODB_URI) {
        throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
    }

    if (cached.conn) {
        registerModels();
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            // Tối ưu cho Vercel Serverless + MongoDB Atlas
            maxPoolSize: 10,          // Giới hạn connection pool (serverless)
            serverSelectionTimeoutMS: 5000,  // Fail fast thay vì treo 30s
            socketTimeoutMS: 45000,   // Timeout socket
            connectTimeoutMS: 10000,  // Timeout kết nối ban đầu
            heartbeatFrequencyMS: 10000, // Giữ connection alive
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
