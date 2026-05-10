import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Notification } from '@/lib/models';
import { getToken } from 'next-auth/jwt';
import mongoose from 'mongoose';

// Helper to get user ID from NextAuth token
const getUserId = async (req: NextRequest): Promise<string | null> => {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    if (!token?.id) {
      return null;
    }
    
    return token.id as string;
  } catch (error) {
    console.error('[Notifications API] Error getting token:', error);
    return null;
  }
};

// GET /api/notifications - Get user's notifications
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    
    if (!userId) {
      console.log('[Notifications GET] Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    console.log('[Notifications GET] Fetching for user:', userId);

    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Math.min(Number(url.searchParams.get('limit') || '20'), 200);
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await Notification.countDocuments({ userId });

    console.log('[Notifications GET] ✅ Found', notifications.length, 'notifications');
    return NextResponse.json({
      data: notifications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('[Notifications GET] ❌ Error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST /api/notifications - Create a new notification
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await req.json();
    const { title, message, type, read = false } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'title and message required' }, { status: 400 });
    }

    const notification = await Notification.create({
      userId,
      title,
      message,
      type: type || 'info',
      read,
      createdAt: new Date()
    });

    console.log('[Notifications POST] ✅ Created notification for user:', userId);
    return NextResponse.json({ data: notification }, { status: 201 });
  } catch (error: unknown) {
    console.error('[Notifications POST] ❌ Error:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const url = new URL(req.url);
    const notificationId = url.searchParams.get('id');
    const { read } = await req.json();

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    console.log('[Notifications PATCH] ✅ Updated notification:', notificationId);
    return NextResponse.json({ data: notification }, { status: 200 });
  } catch (error: unknown) {
    console.error('[Notifications PATCH] ❌ Error:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

