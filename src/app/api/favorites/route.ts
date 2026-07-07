import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import mongoose from 'mongoose';

import { Favorite } from '@/models/favorite.model';
import { normalizeFavoriteItemId } from '@/lib/favorites';

// Helper to handle API errors consistently
const handleApiError = (error: any, context: string) => {
  console.error(`API Error [${context}]:`, error);
  const isDuplicate = error.code === 11000;
  const status = isDuplicate ? 200 : 500;
  const message = isDuplicate
    ? 'This item is already in your favorites'
    : error.message || 'Internal Server Error';
  return NextResponse.json({ error: message, message }, { status });
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

    await connectDB();

    const body = await req.json();
    const { itemId, itemType = 'menu' } = body;

    const normalizedItemId = normalizeFavoriteItemId(itemId);

    // Accept either Mongo ObjectIds or the string IDs used by the app's menu items.
    if (!normalizedItemId) {
      return NextResponse.json({ error: 'Invalid Item ID' }, { status: 400 });
    }

    if (itemType && !['menu', 'other'].includes(itemType)) {
      return NextResponse.json({ error: 'Invalid item type' }, { status: 400 });
    }

    const userIdObj = new mongoose.Types.ObjectId(userId);

    // Check for existing to prevent duplicates
    const existing = await Favorite.findOne({ user: userIdObj, menuItem: normalizedItemId });
    if (existing) {
      return NextResponse.json({
        message: 'Already in favorites',
        data: { itemId, itemType }
      }, { status: 200 });
    }

    // Create new favorite
    const favorite = new Favorite({
      user: userIdObj,
      menuItem: normalizedItemId
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

    await connectDB();

    // Handle both query params and body for backward compatibility
    const url = new URL(req.url);
    const itemId = url.searchParams.get('itemId') || (await req.json().catch(() => ({}))).itemId;
    const normalizedItemId = normalizeFavoriteItemId(itemId);

    if (!normalizedItemId) {
      return NextResponse.json({ error: 'Invalid Item ID' }, { status: 400 });
    }

    await connectDB();

    const result = await Favorite.findOneAndDelete({
      user: new mongoose.Types.ObjectId(userId),
      menuItem: normalizedItemId
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
