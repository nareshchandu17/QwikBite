import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

async function dropIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection established but db object is undefined');
    }
    const collection = db.collection('orders');

    console.log('Checking indexes on "orders" collection...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));

    const idIndexExists = indexes.some(idx => idx.name === 'id_1');

    if (idIndexExists) {
      console.log('Dropping index "id_1"...');
      await collection.dropIndex('id_1');
      console.log('✅ Successfully dropped index "id_1"');
    } else {
      console.log('ℹ️ Index "id_1" not found. It might have already been dropped or has a different name.');
    }

    // Also check for orderId index
    const orderIdIndexExists = indexes.some(idx => idx.name === 'orderId_1');
    if (!orderIdIndexExists) {
      console.log('Note: orderId_1 index not found. Mongoose will likely create it automatically based on the schema.');
    }

  } catch (error) {
    console.error('❌ Error dropping index:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

dropIndex();
