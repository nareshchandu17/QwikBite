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

    // Fix legacy indexes if needed
    try {
      const db = globalCache.conn.connection.db;
      if (db) {
        const orders = db.collection("orders");
        await orders.dropIndex("id_1");
      }
    } catch (e) {
      // Index doesn't exist or already dropped, ignore
    }

    return globalCache.conn;
  } catch (error) {
    globalCache.promise = null;

    throw error;
  }
}

export default connectDB;
