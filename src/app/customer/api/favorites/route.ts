import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Favorite } from '@/lib/models/Favorite';

// GET /api/favorites - Get user's favorites (no userId required, uses default guest user)
export async function GET(request: Request) {
  try {
    await connectDB();
    
    // For now, use a default user ID since we're in public/guest mode
    const userId = 'guest-user';
    
    const favorites = await Favorite.find({ userId });
    console.log('[Favorites API] Fetched', favorites.length, 'favorites for user');
    return NextResponse.json(favorites);
  } catch (error) {
    console.error('[Favorites API] Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/favorites - Add item to favorites
export async function POST(request: Request) {
  try {
    console.log('[Favorites API] Adding to favorites...');
    await connectDB();
    const body = await request.json();
    
    const { itemId, itemType } = body;
    const userId = 'guest-user'; // Use default user ID for guest mode
    
    console.log('[Favorites API] Request:', { userId, itemId, itemType });
    
    if (!itemId || !itemType) {
      return NextResponse.json(
        { error: 'itemId and itemType are required' },
        { status: 400 }
      );
    }
    
    // Check if already favorited
    const existingFavorite = await Favorite.findOne({ userId, itemId, itemType });
    if (existingFavorite) {
      console.log('[Favorites API] Item already favorited');
      return NextResponse.json(
        { error: 'Item already in favorites' },
        { status: 400 }
      );
    }
    
    const newFavorite = new Favorite({ userId, itemId, itemType });
    const savedFavorite = await newFavorite.save();
    
    console.log('[Favorites API] ✅ Favorite added:', { id: savedFavorite._id, itemId, userId });
    return NextResponse.json(savedFavorite, { status: 201 });
  } catch (error) {
    console.error('[Favorites API] Error adding to favorites:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to add to favorites', details: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/favorites - Remove item from favorites
export async function DELETE(request: Request) {
  try {
    console.log('[Favorites API] Removing from favorites...');
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const itemType = searchParams.get('itemType');
    const userId = 'guest-user'; // Use default user ID for guest mode
    
    console.log('[Favorites API] Delete request:', { userId, itemId, itemType });
    
    if (!itemId || !itemType) {
      return NextResponse.json(
        { error: 'itemId and itemType are required' },
        { status: 400 }
      );
    }
    
    const deletedFavorite = await Favorite.findOneAndDelete({ userId, itemId, itemType });
    
    if (!deletedFavorite) {
      console.log('[Favorites API] Favorite not found');
      return NextResponse.json(
        { error: 'Favorite not found' },
        { status: 404 }
      );
    }
    
    console.log('[Favorites API] ✅ Favorite removed:', { itemId, userId });
    return NextResponse.json({ success: true, message: 'Favorite removed' });
  } catch (error) {
    console.error('[Favorites API] Error removing favorite:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to remove from favorites', details: errorMessage },
      { status: 500 }
    );
  }
}