import mongoose from 'mongoose';
import { connectDB } from '../src/lib/db';
import { Order } from '../src/models/order.model';

async function checkDatabase() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected.');

    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection not established');
    const collection = db.collection('orders');
    
    // 1. Check Indexes
    console.log('\n📊 Checking Indexes on "orders" collection:');
    const indexes = await collection.indexes();
    console.log(JSON.stringify(indexes, null, 2));

    const hasIdIndex = indexes.some(idx => idx.name === 'id_1');
    if (hasIdIndex) {
      console.log('⚠️ Legacy "id_1" index STILL EXISTS!');
    } else {
      console.log('✅ Legacy "id_1" index is GONE.');
    }

    // 2. Check for null ids
    console.log('\n🧐 Checking for documents with "id: null":');
    const nullIdCount = await collection.countDocuments({ id: null });
    console.log(`Found ${nullIdCount} documents with id: null`);

    // 3. Check most recent orders
    console.log('\n📋 Most recent 5 orders:');
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).lean();
    recentOrders.forEach((o, i) => {
      console.log(`${i+1}. _id: ${o._id}, orderId: ${o.orderId}, status: ${o.status}, createdAt: ${o.createdAt}`);
      if ((o as any).id === null) {
         console.log('   !!! Has legacy "id" field set to null');
      }
    });

    console.log('\n✅ Database check complete.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking database:', error);
    process.exit(1);
  }
}

checkDatabase();
