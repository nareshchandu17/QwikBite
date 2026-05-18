import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.warn('⚠️ MONGODB_URI is missing at build time. Using placeholder for build safety.');
  } else {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
  }
}

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/placeholder';
const options = {};

let client;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise!;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default async function connectDB() {
  return clientPromise;
}
