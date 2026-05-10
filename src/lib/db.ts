import mongoose from "mongoose";

/**
 * Global cache to prevent multiple connections in Next.js
 */
declare global {
  var mongooseCache:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const globalCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = globalCache;

export async function connectDB(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is missing from environment variables");
    throw new Error("MONGODB_URI is not defined");
  }

  if (globalCache.conn) {
    return globalCache.conn;
  }

  if (!globalCache.promise) {
    globalCache.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    });
  }

  try {
    globalCache.conn = await globalCache.promise;
    console.log("✅ MongoDB connected successfully");
    return globalCache.conn;
  } catch (error) {
    globalCache.promise = null;
    console.error("❌ MongoDB connection failed:", error);
    throw error;
  }
}

export default connectDB;
