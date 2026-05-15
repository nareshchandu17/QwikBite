import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import mongoose from 'mongoose';

import { Favorite } from '@/models/favorite.model';

// Helper to handle API errors consistently
const handleApiError = (error: any, context: string) => {
  console.error(`API Error [${context}]:`, error);
  const status = error.code === 11000 ? 409 : 500;
  const message = error.code === 11000
    ? 'This item is already in your favorites'
    : error.message || 'Internal Server Error';
  return NextResponse.json({ error: message }, { status });
};

// Helper to get user ID from NextAuth session
const getUserId = async (req: NextRequest): Promise<string | null> => {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session || !session.user) {
      console.log('[Favorites API] No valid session found');
      return null;
    }

    const userId = session.user.id;
    console.log('[Favorites API] ✅ Auth successful via NextAuth session, user:', userId);
    return userId;
  } catch (error) {
    console.error('[Favorites API] Session verification error:', error);
    return null;
  }
};

// GET /api/favorites - Get user's favorites
export async function GET(req: NextRequest) {
  try {
    console.log('[Favorites API] GET request received');
    
    // Get user ID from NextAuth session
    const userId = await getUserId(req);
    
    if (!userId) {
      console.log('[Favorites API] Unauthorized - no valid session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('[Favorites API] User authenticated:', userId);
    
    await connectDB();

    const favorites = await Favorite.find({
      user: new mongoose.Types.ObjectId(userId)
    }).select('menuItem').lean();

    console.log('[Favorites API] Found', favorites.length, 'favorites for user:', userId);

    return NextResponse.json({
      data: favorites.map((fav: any) => ({
        itemId: fav.menuItem.toString(),
        itemType: 'menu' // Default to menu as per the new model
      }))
    }, { status: 200 });

  } catch (error: any) {
    console.error('[Favorites API] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}

// POST /api/favorites - Add item to favorites
export async function POST(req: NextRequest) {
  try {
    console.log('[Favorites API] POST request received');
    
    // Get user ID from NextAuth session
    const userId = await getUserId(req);
    
    if (!userId) {
      console.log('[Favorites API] Unauthorized - no valid session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('[Favorites API] User authenticated:', userId);

    const body = await req.json();
    const { itemId, itemType = 'menu' } = body;

    // Strict validation
    if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
      return NextResponse.json({ error: 'Invalid Item ID' }, { status: 400 });
    }

    if (itemType && !['menu', 'other'].includes(itemType)) {
      return NextResponse.json({ error: 'Invalid item type' }, { status: 400 });
    }

    const userIdObj = new mongoose.Types.ObjectId(userId);
    const itemIdObj = new mongoose.Types.ObjectId(itemId);

    // Check for existing to prevent duplicates
    const existing = await Favorite.findOne({ user: userIdObj, menuItem: itemIdObj });
    if (existing) {
      return NextResponse.json({
        message: 'Already in favorites',
        data: { itemId, itemType }
      });
    }

    // Create new favorite
    const favorite = new Favorite({
      user: userIdObj,
      menuItem: itemIdObj
    });

    await favorite.save();
    console.log('[Favorites API] Added favorite:', { userId, itemId });

    return NextResponse.json({
      message: 'Added to favorites',
      data: { itemId, itemType }
    }, { status: 201 });

  } catch (error: any) {
    console.error('[Favorites API] POST error:', error);
    return handleApiError(error, 'POST /favorites');
  }
}

// DELETE /api/favorites - Remove item from favorites
export async function DELETE(req: NextRequest) {
  try {
    console.log('[Favorites API] DELETE request received');
    
    // Get user ID from NextAuth session
    const userId = await getUserId(req);
    
    if (!userId) {
      console.log('[Favorites API] Unauthorized - no valid session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('[Favorites API] User authenticated:', userId);

    // Handle both query params and body for backward compatibility
    const url = new URL(req.url);
    const itemId = url.searchParams.get('itemId') || (await req.json().catch(() => ({}))).itemId;

    if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
      return NextResponse.json({ error: 'Invalid Item ID' }, { status: 400 });
    }

    await connectDB();

    const result = await Favorite.findOneAndDelete({
      user: new mongoose.Types.ObjectId(userId),
      menuItem: new mongoose.Types.ObjectId(itemId)
    });

    if (!result) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
    }

    console.log('[Favorites API] Removed favorite:', { userId, itemId });

    return NextResponse.json({
      message: 'Removed from favorites',
      data: { itemId }
    });

  } catch (error: any) {
    console.error('[Favorites API] DELETE error:', error);
    return handleApiError(error, 'DELETE /favorites');
  }
}
