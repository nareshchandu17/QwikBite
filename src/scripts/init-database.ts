import mongoose from 'mongoose';
import { connectDB } from '../lib/db';
import { MenuItem } from '../lib/models/MenuItem';
import { menuItems } from '../data/menu';
import { Favorite } from '../lib/models/Favorite';
import { Order } from '../lib/models/Order';
import { User } from '../lib/models/User';

async function initDatabase() {
  try {
    await connectDB();
    
    console.log('Initializing database collections...');
    
    // Initialize MenuItems collection
    const menuItemCount = await MenuItem.countDocuments();
    if (menuItemCount === 0) {
      console.log('Seeding menu items...');
      await MenuItem.insertMany(
        menuItems.map(item => ({
          ...item,
          _id: undefined
        }))
      );
      console.log(`Seeded ${menuItems.length} menu items`);
    } else {
      console.log(`Menu items collection already has ${menuItemCount} items`);
    }
    
    // Initialize other collections (they'll be created automatically when first used)
    await Favorite.createCollection().catch(() => console.log('Favorites collection already exists'));
    await Order.createCollection().catch(() => console.log('Orders collection already exists'));
    await User.createCollection().catch(() => console.log('Users collection already exists'));
    
    console.log('Database initialization complete!');
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error initializing database:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the init function
initDatabase();