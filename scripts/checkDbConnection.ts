import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { connectDB } from '../src/lib/db';
import { IStaff } from '../src/models/staff.model';

// Import the Staff model
let Staff: mongoose.Model<IStaff>;

try {
  // Try to get the existing model to avoid OverwriteModelError
  Staff = mongoose.model<IStaff>('Staff');
} catch {
  // If model doesn't exist, create it
  const staffSchema = new mongoose.Schema<IStaff>({
    name: { type: String, required: true },
    role: { type: String, required: true },
    phone: { type: String, required: true },
    shift: { type: String, required: true },
    isActive: { type: Boolean, required: true },
    salary: { type: Number },
    joinedAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }, { collection: 'staffmanagement' });

  // Create indexes
  staffSchema.index({ phone: 1 }, { unique: true });
  
  Staff = mongoose.model<IStaff>('Staff', staffSchema);
}

async function checkAndInitializeDatabase() {
  try {
    console.log('🔍 Checking database connection...');
    
    // Connect to MongoDB
    await connectDB();
    
    // Ensure we have a database connection
    if (!mongoose.connection.db) {
      throw new Error('Failed to connect to database');
    }

    const db = mongoose.connection.db;
    console.log(`✅ Connected to database: ${db.databaseName}`);
    
    try {
      // Check if staffmanagement collection exists
      const collections = await db.listCollections({ name: 'staffmanagement' }).toArray();
      const staffCollectionExists = collections.length > 0;
      
      if (!staffCollectionExists) {
        console.log('ℹ️ No staffmanagement collection found. Will be created when first document is saved.');
      } else {
        console.log('✅ staffmanagement collection exists');
      }
      
      // Check document count using Mongoose model
      const count = await Staff.countDocuments();
      console.log(`📊 Number of staff members in database: ${count}`);
      
      if (count === 0) {
        console.log('ℹ️ No staff members found. Creating sample data...');
        
        // Create a sample staff member using the Mongoose model
        const sampleStaff = new Staff({
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'Manager',
          status: 'Active',
          shift: '09:00 AM - 05:00 PM',
          contact: '+1234567890',
          performance: 100,
          avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=random'
        });
        
        // Save the document
        const savedStaff = await sampleStaff.save();
        console.log('✅ Added sample staff member with ID:', savedStaff._id);
        
        // Verify the document was inserted
        const insertedDoc = await Staff.findById(savedStaff._id);
        if (insertedDoc) {
          console.log('✅ Successfully verified document in database:', JSON.stringify(insertedDoc.toObject(), null, 2));
        } else {
          console.error('❌ Failed to verify document was inserted');
        }
      } else {
        console.log('ℹ️ Staff members already exist in the collection');
        // Log the first few documents for verification
        const docs = await Staff.find().limit(3).lean();
        console.log('Sample documents:', JSON.stringify(docs, null, 2));
      }
    } catch (error) {
      console.error('❌ Error checking database:', error);
      throw error; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    try {
      // Close the connection
      if (mongoose.connection.readyState === 1) { // 1 = connected
        console.log('🛑 Closing database connection...');
        await mongoose.connection.close();
        console.log('✅ Database connection closed');
      }
    } catch (error) {
      console.error('Error closing connection:', error);
    } finally {
      process.exit(0);
    }
  }
}

// Run the function
checkAndInitializeDatabase();
