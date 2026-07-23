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
      family: 4, // Force IPv4 to fix querySrv ECONNREFUSED issues
    });
  }

  try {
    globalCache.conn = await globalCache.promise;
    console.log("✅ MongoDB connected successfully");

    // Fix legacy indexes if needed
    try {
      const db = globalCache.conn.connection.db;
      if (db) {
        const orders = db.collection('orders');
        await orders.dropIndex('id_1');
        console.log("🧹 Dropped legacy 'id_1' index from orders collection");
      }
    } catch (e) {
      // Index doesn't exist or already dropped, ignore
    }

    return globalCache.conn;
  } catch (error) {
    globalCache.promise = null;
    console.error("❌ MongoDB connection failed:", error);
    throw error;
  }
}

export default connectDB;
