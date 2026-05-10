import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { menuItems } from '../src/data/menu';

dotenv.config();

// Load environment variables
const MONGODB_URI = process.env.MONGODB_URI || '';

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Define the MenuItem schema
const menuItemSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  calories: { type: Number, default: 0 },
  image: { type: String, default: '/images/placeholder-food.jpg' },
  category: { type: String, required: true },
  tags: { type: [String], default: [] },
  available: { type: Boolean, default: true },
  prep_time: { type: Number, default: 15 },
  availability: { type: String, enum: ['Available', 'Unavailable'], default: 'Available' },
  isVegetarian: { type: Boolean, default: false },
  isVegan: { type: Boolean, default: false },
  isGlutenFree: { type: Boolean, default: false },
  isDairyFree: { type: Boolean, default: false },
  isPopular: { type: Boolean, default: false },
  rating: { type: Number, min: 0, max: 5 },
}, { timestamps: true });

const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema);

async function seedDatabase() {
  try {
    await connectDB();
    
    // Clear existing items
    console.log('Clearing existing menu items...');
    await MenuItem.deleteMany({});
    
    // Map the menu items to the correct format for the database
    const itemsToSeed = menuItems.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      originalPrice: item.originalPrice,
      calories: item.calories || 0,
      image: item.image || '/images/placeholder-food.jpg',
      category: item.category,
      tags: Array.isArray(item.tags) ? item.tags : [],
      available: item.available !== undefined ? item.available : true,
      prep_time: item.prep_time || 15,
      availability: item.availability || 'Available',
      isVegetarian: item.isVegetarian || false,
      isVegan: item.isVegan || false,
      isGlutenFree: item.isGlutenFree || false,
      isDairyFree: item.isDairyFree || false,
      isPopular: item.isPopular || false,
      rating: item.rating,
    }));

    console.log(`Found ${itemsToSeed.length} menu items to seed...`);
    
    // Insert items
    const result = await MenuItem.insertMany(itemsToSeed);
    
    console.log(`✅ Successfully seeded ${result.length} menu items!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

// Run the seed function
seedDatabase().catch(console.error);
