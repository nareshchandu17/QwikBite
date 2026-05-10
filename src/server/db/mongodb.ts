import { MongoClient, Db } from 'mongodb';

class MongoDBService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected = false;

  async connect() {
    if (this.isConnected && this.db) {
      return this.db;
    }

    try {
      const uri = process.env.MONGODB_URI;
      if (!uri) {
        throw new Error('Please define the MONGODB_URI environment variable inside .env');
      }
      const dbName = process.env.MONGODB_DB || 'qwikbite';

      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db(dbName);
      this.isConnected = true;

      console.log('Connected to MongoDB');
      return this.db;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      this.db = null;
      console.log('Disconnected from MongoDB');
    }
  }

  getDb() {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  isConnectedStatus() {
    return this.isConnected;
  }
}

// Export a singleton instance
export const mongoDBService = new MongoDBService();