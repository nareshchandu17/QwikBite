import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';

// Simple test to check database and models
export async function GET(req: NextRequest) {
  try {
    console.log('[DB Test] Starting database test...');
    
    await connectDB();
    console.log('[DB Test] Database connected successfully');
    
    // Check if we can access the Favorite model
    try {
      const Favorite = mongoose.model('Favorite');
      console.log('[DB Test] Favorite model found');
      
      const count = await Favorite.countDocuments();
      console.log('[DB Test] Total favorites in database:', count);
      
      // Get a few sample favorites
      const samples = await Favorite.find({}).limit(3).lean();
      console.log('[DB Test] Sample favorites:', samples);
      
      return NextResponse.json({
        success: true,
        message: 'Database test successful',
        totalFavorites: count,
        samples: samples
      });
      
    } catch (modelError: unknown) {
      console.error('[DB Test] Favorite model error:', modelError);
      return NextResponse.json({
        success: false,
        error: 'Favorite model error: ' + modelError.message
      }, { status: 500 });
    }
    
  } catch (error: unknown) {
    console.error('[DB Test] Database connection error:', error);
    return NextResponse.json({
      success: false,
      error: 'Database connection error: ' + error.message
    }, { status: 500 });
  }
}
