import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getAuthCookie } from '@/lib/auth';
import connectDB from '@/lib/db';
import SystemNotification from '@/lib/models/SystemNotification';
import { Types } from 'mongoose';

// Helper function to handle errors consistently
function handleError(error: unknown, context: string) {
  console.error(`[SystemNotifications] Error in ${context}:`, error);
  return NextResponse.json(
    { 
      error: 'Internal Server Error',
      message: error.message || 'An unexpected error occurred',
      context
    },
    { status: 500 }
  );
}

// GET /api/system-notifications - Fetch notifications
export async function GET(req: NextRequest) {
  try {
    // Validate request URL
    if (!req.url) {
      return NextResponse.json(
        { error: 'Invalid request: Missing URL' },
        { status: 400 }
      );
    }

    try {
      // Connect to database with error handling
      await connectDB();
      console.log('Database connection successful');
    } catch (dbError) {
      return handleError(dbError, 'database connection');
    }

    // Get token from cookie or Authorization header
    const token = getAuthCookie(req) || req.headers.get('authorization')?.replace('Bearer ', '');
    const session = token ? verifyToken(token) : null;
    console.log('Session retrieved:', session ? 'valid' : 'invalid');
    
    if (!session?.id) {
      console.warn('Unauthorized access attempt - no valid session');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No valid session found' }, 
        { status: 401 }
      );
    }

    try {
      // Parse and validate query parameters
      const url = new URL(req.url);
      const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
      const limit = Math.min(Number(url.searchParams.get('limit') || '20'), 100);
      const skip = (page - 1) * limit;
      const unreadOnly = url.searchParams.get('unreadOnly') === 'true';

      // Build query filter
      const filter: unknown = { role: session.role };
      
      // Customers can only see their own notifications
      if (session.role === 'customer') {
        try {
          filter.userId = new Types.ObjectId(session.id);
        } catch (idError) {
          console.error('Invalid user ID format:', session.id);
          return NextResponse.json(
            { error: 'Invalid user ID format' },
            { status: 400 }
          );
        }
      }
      
      // Filter for unread only if specified
      if (unreadOnly) {
        filter.isRead = false;
      }

      console.log('Fetching notifications with filter:', JSON.stringify(filter, null, 2));
      
      // Execute queries in parallel for better performance
      const [notifications, total] = await Promise.all([
        SystemNotification.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        SystemNotification.countDocuments(filter).exec()
      ]);

      return NextResponse.json({
        success: true,
        data: notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (queryError) {
      console.error('Database query error:', queryError);
      return handleError(queryError, 'database query');
    }
  } catch (error) {
    console.error('Request processing error:', error);
    return handleError(error, 'request processing');
  }
}

// PUT /api/system-notifications - Mark notifications as read
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    
    // Get token from cookie or Authorization header
    const token = getAuthCookie(req) || req.headers.get('authorization')?.replace('Bearer ', '');
    const session = token ? verifyToken(token) : null;
    
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationIds } = await req.json();

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ error: 'Notification IDs array is required' }, { status: 400 });
    }

    // Validate ObjectIds
    const validIds = notificationIds.filter(id => Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return NextResponse.json({ error: 'Valid notification IDs required' }, { status: 400 });
    }

    const filter: unknown = {
      _id: { $in: validIds.map(id => new Types.ObjectId(id)) },
      role: session.role
    };

    // Customers can only mark their own notifications as read
    if (session.role === 'customer') {
      filter.userId = new Types.ObjectId(session.id);
    }

    const result = await SystemNotification.updateMany(
      filter,
      { isRead: true }
    );

    return NextResponse.json({ 
      message: 'Notifications marked as read',
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
  }
}
