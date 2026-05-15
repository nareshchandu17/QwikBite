import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Staff, StaffRole } from '../src/models/staff.model';
import { connectDB } from '../src/lib/db';

declare module 'mongoose' {
  interface ConnectionBase {
    db: {
      listCollections(filter?: any): { toArray(): Promise<any[]> };
      createCollection(name: string): Promise<any>;
    };
  }
}

async function initStaffManagement() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Ensure we have a database connection
    if (!mongoose.connection.db) {
      throw new Error('MongoDB connection not established');
    }

    // Check if staffmanagement collection exists, create if it doesn't
    const collections = await mongoose.connection.db.listCollections({ name: 'staffmanagement' }).toArray();
    if (collections.length === 0) {
      console.log('Creating staffmanagement collection...');
      await mongoose.connection.db.createCollection('staffmanagement');
      console.log('✅ Created staffmanagement collection');
    } else {
      console.log('staffmanagement collection already exists');
    }

    // Check if collection is empty
    const count = await Staff.countDocuments();
    console.log(`Found ${count} documents in staffmanagement collection`);

    // Add a sample staff member if collection is empty
    if (count === 0) {
      console.log('Adding initial staff member...');
      await Staff.create({
        name: 'Admin User',
        email: 'admin@example.com',
        role: StaffRole.MANAGER,
        isActive: true,
        shift: 'Morning',
        phone: '9876543210'
      });
      console.log('✅ Added initial staff member');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing staffmanagement:', error);
    process.exit(1);
  }
}

// Run the initialization
initStaffManagement();
