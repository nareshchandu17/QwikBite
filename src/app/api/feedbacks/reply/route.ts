import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import FeedbackCollection from '@/lib/models/FeedbackCollection';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: NextRequest) {
  // Admin authentication check
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as { role?: string }).role;
  if (!['admin', 'canteen_staff'].includes(userRole as any)) {
    return NextResponse.json({ success: false, error: 'Forbidden - Insufficient permissions' }, { status: 403 });
  }

  await connectDB();

  try {
    const { feedbackId, reply } = await req.json();

    if (!feedbackId || !reply) {
      return NextResponse.json({ 
        success: false, 
        error: 'Feedback ID and reply are required' 
      }, { status: 400 });
    }

    // Find the feedback using Mongoose
    const feedback = await FeedbackCollection.findOne({ feedbackId });
    
    if (!feedback) {
      return NextResponse.json({ 
        success: false, 
        error: 'Feedback not found' 
      }, { status: 404 });
    }

    // Update the feedback with the admin reply
    feedback.adminReply = reply;
    await feedback.save();

    // Create notification for the customer
    if (feedback.studentId && feedback.name) {
      try {
        const notificationData = {
          userId: feedback.studentId,
          title: 'Admin replied to your feedback',
          message: `Admin has replied to your feedback: "${reply.substring(0, 100)}${reply.length > 100 ? '...' : ''}"`,
          type: 'feedback_reply',
          priority: 'normal',
          isRead: false,
          createdAt: new Date(),
          ctaLink: `/customer/feedback?feedbackId=${feedback._id.toString()}`,
          data: {
            feedbackId: feedback._id.toString(),
            feedbackText: feedback.feedbackText,
            adminReply: reply
          }
        };
        
        // Try to use Mongoose model if exists, otherwise fallback to direct insert
        try {
          const NotificationModule = await import('@/lib/models/Notification');
          const NotificationModel = (NotificationModule as any).default || (NotificationModule as any).Notification || NotificationModule;
          await NotificationModel.create(notificationData);
        } catch {
          // Fallback to direct MongoDB
          const { MongoClient } = await import('mongodb');
          const client = new MongoClient(process.env.MONGODB_URI!);
          await client.connect();
          const db = client.db();
          await db.collection('notifications').insertOne(notificationData);
          await client.close();
        }
        
        // Emit WebSocket notification if available
        try {
          const channel = `user-${feedback.studentId}`;
          await pusherServer.trigger(channel, 'new_notification', {
            userId: feedback.studentId,
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type,
            priority: notificationData.priority,
            ctaLink: notificationData.ctaLink,
            data: notificationData.data,
            timestamp: notificationData.createdAt
          });
        } catch (wsError) {
          // WebSocket notification failed, but don't fail the request
        }
      } catch (notifError) {
        // Don't fail the reply if notification fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Reply added successfully' 
    });

  } catch (error: any) {
    console.error('Error adding reply:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
