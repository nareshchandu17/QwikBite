import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.warn('⚠️ MONGODB_URI is missing at build time. Using placeholder for build safety.');
  } else {
    throw new Error('Please define the MONGODB_URI environment variable');
  }
}

if (!process.env.MONGODB_DB) {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.warn('⚠️ MONGODB_DB is missing at build time. Using placeholder for build safety.');
  } else {
    throw new Error('Please define the MONGODB_DB environment variable');
  }
}

let cachedClient: MongoClient;
let cachedDb: Db;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export const collections = {
  users: 'users',
  orders: 'orders',
  menuItems: 'menuItems',
  orderStatusUpdates: 'orderStatusUpdates'
};
