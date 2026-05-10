import mongoose from 'mongoose';
import { menuItems } from '../data/menu';
import { MenuItem } from '../lib/models/MenuItem';
import { connectDB } from '../lib/db';

async function seedMenuItems() {
  try {
    await connectDB();
    
    // Clear existing menu items
    await MenuItem.deleteMany({});
    
    // Insert all menu items
    const insertedItems = await MenuItem.insertMany(
      menuItems.map(item => ({
        ...item,
        _id: undefined // Remove any existing _id to let MongoDB generate new ones
      }))
    );
    
    console.log(`Successfully seeded ${insertedItems.length} menu items`);
    
    // Close the connection
    await mongoose.connection.close();
    
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding menu items:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the seed function
seedMenuItems();