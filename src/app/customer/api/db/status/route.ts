import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';

export async function GET() {
  try {
    // Connect to the database
    await connectDB();
    
    // Get the database connection
    const db = mongoose.connection;
    
    // Check if connection is established and db is available
    if (!db || !db.db) {
      throw new Error('Database connection not established');
    }
    
    // Get all collections
    const collections = await db.db.listCollections().toArray();
    
    // Get database stats
    const stats = await db.db.stats();
    
    return NextResponse.json({
      status: 'success',
      connected: true,
      dbName: db.name,
      host: db.host,
      port: db.port,
      collections: collections.map(c => c.name),
      stats: {
        collections: stats.collections,
        objects: stats.objects,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize,
      }
    });
    
  } catch (error: unknown) {
    return NextResponse.json({
      status: 'error',
      connected: false,
      error: error.message
    }, { status: 500 });
  }
}
