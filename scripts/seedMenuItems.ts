const path = require('path');
const mongoose = require('mongoose');
// Import the menu data from the correct path
const { menuItems: initialMenuItems } = require('../src/data/menu.ts');
const { connectDB } = require('../src/lib/db');
const MenuItem = require('../src/models/MenuItem');

async function seedDatabase() {
  // Ensure we have items to seed
  if (!initialMenuItems || !Array.isArray(initialMenuItems) || initialMenuItems.length === 0) {
    console.error('No menu items found to seed');
    return;
  }
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    console.log('Clearing existing menu items...');
    await MenuItem.deleteMany({});
    
    console.log(`Seeding ${initialMenuItems.length} menu items...`);
    const itemsWithDefaults = initialMenuItems.map(item => ({
      ...item,
      available: true,
      availability: 'Available',
      tags: Array.isArray(item.tags) ? item.tags : [],
      prep_time: item.prep_time || 15,
      calories: item.calories || 0,
      image: item.image || '/images/placeholder-food.jpg',
    }));
    
    const result = await MenuItem.insertMany(itemsWithDefaults);
    console.log(`✅ Successfully seeded ${result.length} menu items!`);
    
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    // Close the database connection if it exists
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// Run the seed function
seedDatabase().catch(console.error);
