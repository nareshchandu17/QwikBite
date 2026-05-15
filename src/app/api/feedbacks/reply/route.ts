import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    const { feedbackId, reply } = await req.json();

    if (!feedbackId || !reply) {
      return NextResponse.json({ 
        success: false, 
        error: 'Feedback ID and reply are required' 
      }, { status: 400 });
    }

    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db();

    // First, get the feedback details to find the customer
    const feedback = await db.collection('feedbacks').findOne({ feedbackId: feedbackId });
    
    if (!feedback) {
      await client.close();
      return NextResponse.json({ 
        success: false, 
        error: 'Feedback not found' 
      }, { status: 404 });
    }

    // Update the feedback with the admin reply
    const result = await db.collection('feedbacks').updateOne(
      { feedbackId: feedbackId },
      { 
        $set: { 
          adminReply: reply,
          updatedAt: new Date()
        }
      }
    );

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
          data: {
            feedbackId: feedbackId,
            feedbackText: feedback.feedbackText,
            adminReply: reply
          }
        };
        
        await db.collection('notifications').insertOne(notificationData);
        console.log('[Feedback Reply] ✅ Customer notification created for:', feedback.studentId);
        
        // Also emit WebSocket notification if available
        try {
          const { pusherServer } = await import('@/lib/pusher');
          const channel = `user-${feedback.studentId}`;
          await pusherServer.trigger(channel, 'new_notification', {
            userId: feedback.studentId,
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type,
            priority: notificationData.priority,
            data: notificationData.data,
            timestamp: notificationData.createdAt
          });
        } catch (wsError) {
          console.log('[Feedback Reply] ⚠️ WebSocket notification failed:', wsError);
        }
        
      } catch (notifError) {
        console.error('[Feedback Reply] ❌ Failed to create customer notification:', notifError);
        // Don't fail the reply if notification fails
      }
    }

    await client.close();

    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Feedback not found' 
      }, { status: 404 });
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
