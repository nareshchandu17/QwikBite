export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Feedback, { IFeedback } from '@/models/feedback';
import { verifyToken, parseCookies } from '@/lib/auth';
import { Types } from 'mongoose';

// Interface for the lean document returned by Mongoose
interface FeedbackDocument extends Omit<IFeedback, '_id' | 'userId'> {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Helper to get user ID from auth token
const getUserId = (req: NextRequest): string | null => {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = parseCookies(cookieHeader);
    const token = cookies['auth_token'];
    if (!token) return null;
    
    const payload = verifyToken(token);
    if (!payload?.id) return null;
    
    return payload.id;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

// GET /api/feedbacks - Get user's feedback history
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const minRating = searchParams.get('minRating');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    const query: any = { userId };
    if (category) query.category = category;
    if (minRating) query.starRating = { $gte: parseInt(minRating) };

    // Execute query
    const feedbacks = await Feedback.find(query)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .lean();

    return NextResponse.json({ 
      success: true, 
      data: (feedbacks as unknown as FeedbackDocument[]).map(fb => ({
        ...fb,
        _id: fb._id.toString(),
        userId: fb.userId.toString(),
        createdAt: fb.createdAt.toISOString(),
        updatedAt: fb.updatedAt.toISOString()
      }))
    });

  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch feedback history',
        ...(process.env.NODE_ENV === 'development' && { 
          details: error instanceof Error ? error.message : String(error) 
        })
      }, 
      { status: 500 }
    );
  }
}
