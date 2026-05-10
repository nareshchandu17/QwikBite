import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { MenuItem } from '@/lib/models/MenuItem';
import { menuItems as staticMenuItems } from '@/data/menu';

// GET /api/menu-items - Get all menu items
export async function GET() {
  try {
    await connectDB();
    
    // First try to get from database
    const dbMenuItems = await MenuItem.find({}).sort({ category: 1, name: 1 });
    
    // If no items in database, seed with static data
    if (dbMenuItems.length === 0) {
      // Seed database with static menu items
      const seededItems = await MenuItem.insertMany(staticMenuItems.map(item => ({
        ...item,
        _id: undefined // Remove any existing _id to let MongoDB generate new ones
      })));
      return NextResponse.json(seededItems);
    }
    
    return NextResponse.json(dbMenuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}

// POST /api/menu-items - Create a new menu item
export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    
    const newMenuItem = new MenuItem(body);
    const savedMenuItem = await newMenuItem.save();
    
    return NextResponse.json(savedMenuItem, { status: 201 });
  } catch (error) {
    console.error('Error creating menu item:', error);
    return NextResponse.json(
      { error: 'Failed to create menu item' },
      { status: 500 }
    );
  }
}