import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Notification } from '@/lib/models';
import { User } from '@/lib/models';
import { verifyToken, parseCookies } from '@/lib/auth';
import mongoose from 'mongoose';
import { pusherServer } from '@/lib/pusher';

// Helper to get user ID and verify admin
const getAdminUser = async (req: NextRequest): Promise<any | null> => {
  const cookieHeader = req.headers.get('cookie');
  const cookies = parseCookies(cookieHeader);
  const token = cookies['auth_token'];
  if (!token) return null;
  
  const payload = verifyToken(token);
  if (!payload?.id) return null;

  const user = await User.findById(payload.id);
  if (!user || (user.role !== 'admin' && user.role !== 'canteen_staff')) {
    return null;
  }

  return user;
};

// POST /api/admin/notifications/send - Send notification to customer(s)
export async function POST(req: NextRequest) {
  await connectToDatabase();
  const adminUser = await getAdminUser(req);
  
  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { userId, title, message, type = 'system', priority = 'normal', icon, data, ctaLink } = body;

    if (!userId || !title || !message) {
      return NextResponse.json({ 
        error: 'userId, title, and message are required' 
      }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }

    // Create notification in database
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      priority,
      icon,
      data,
      ctaLink,
      isRead: false,
      createdAt: new Date(),
      sentBy: adminUser._id
    });

    // Emit WebSocket event to notify customer in real-time
    try {
      const channel = `user-${notification.userId?.toString()}`;
      await pusherServer.trigger(channel, 'new_notification', {
        id: notification._id?.toString(),
        userId: notification.userId?.toString(),
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        icon: notification.icon,
        data: notification.data,
        isRead: notification.isRead,
        timestamp: notification.createdAt,
        ctaLink: notification.ctaLink
      });
    } catch (err) {
      console.warn('Failed to emit notification via Pusher', err);
    }

    return NextResponse.json({ 
      data: notification,
      message: 'Notification sent successfully'
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}

// POST /api/admin/notifications/broadcast - Send notification to all customers
export async function PUT(req: NextRequest) {
  await connectToDatabase();
  const adminUser = await getAdminUser(req);
  
  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, message, type = 'system', priority = 'normal', icon, data, ctaLink } = body;

    if (!title || !message) {
      return NextResponse.json({ 
        error: 'title and message are required' 
      }, { status: 400 });
    }

    // Get all customer users
    const customers = await User.find({ role: 'customer' }, '_id');
    
    if (customers.length === 0) {
      return NextResponse.json({ message: 'No customers found' }, { status: 200 });
    }

    // Create notifications for each customer
    const notifications = await Notification.insertMany(
      customers.map(customer => ({
        userId: customer._id,
        title,
        message,
        type,
        priority,
        icon,
        data,
        ctaLink,
        isRead: false,
        createdAt: new Date(),
        sentBy: adminUser._id
      }))
    );

    // Emit WebSocket event to all customers (single broadcast)
    await pusherServer.trigger('broadcast', 'new_notification', {
      title,
      message,
      type,
      priority,
      icon,
      data,
      isRead: false,
      timestamp: new Date(),
      ctaLink
    });

    return NextResponse.json({ 
      data: notifications,
      message: `Broadcast notification sent to ${customers.length} customers`
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error broadcasting notification:', error);
    return NextResponse.json({ error: 'Failed to broadcast notification' }, { status: 500 });
  }
}
