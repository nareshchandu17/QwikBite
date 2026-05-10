import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Notification } from '@/lib/models';
import { verifyToken, parseCookies } from '@/lib/auth';
import mongoose from 'mongoose';

// Helper to get user ID from auth token
const getUserId = (req: NextRequest): string | null => {
  const cookieHeader = req.headers.get('cookie');
  const cookies = parseCookies(cookieHeader);
  const token = cookies['auth_token'];
  if (!token) return null;
  
  const payload = verifyToken(token);
  return payload?.id || null;
};

// POST /api/customer/notifications/mark-all-read - Mark all notifications as read
export async function POST(req: NextRequest) {
  await connectToDatabase();
  const userId = getUserId(req);
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    return NextResponse.json({ 
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
