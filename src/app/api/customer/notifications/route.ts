export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Notification } from '@/lib/models';
import { getToken } from 'next-auth/jwt';
import mongoose from 'mongoose';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { checkRateLimit, getRateLimitIdentifier, RateLimitPresets } from '@/lib/security/rateLimiter';

// GET /api/customer/notifications - Get customer's notifications
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user?.id) {
      console.log('[Notifications GET] Unauthorized - no user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting for GET requests
    const identifier = getRateLimitIdentifier(req);
    const rateLimit = checkRateLimit(identifier, RateLimitPresets.LENIENT.limit, RateLimitPresets.LENIENT.windowMs);
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const userId = user.id;
    await connectToDatabase();
    console.log('[Notifications GET] Fetching for user:', userId);

    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Math.min(Number(url.searchParams.get('limit') || '50'), 200);
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('[Notifications GET] Invalid userId:', userId);
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await Notification.countDocuments({ userId });

    console.log('[Notifications GET] ✅ Found', notifications.length, 'notifications for user:', userId);

    return NextResponse.json({
      data: notifications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('[Notifications GET] ❌ Error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
