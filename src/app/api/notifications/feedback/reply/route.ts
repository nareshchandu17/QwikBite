/**
 * POST /api/notifications/feedback/reply
 * 
 * Called when admin replies to customer feedback
 * Notifies customer about the admin's reply
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import NotificationService from '@/lib/services/notification.service';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { feedbackId, userId, replyMessage } = await req.json();

    if (!feedbackId || !userId || !replyMessage) {
      return NextResponse.json(
        { error: 'feedbackId, userId, and replyMessage are required' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Invalid userId' },
        { status: 400 }
      );
    }

    // Send notification to customer
    await NotificationService.notifyCustomer({
      userId,
      title: '💬 Admin Reply to Your Feedback',
      message: replyMessage.substring(0, 100) + (replyMessage.length > 100 ? '...' : ''),
      type: 'feedback',
      priority: 'high',
      icon: '💬',
      data: {
        feedbackId,
        replyMessage,
        timestamp: new Date().toISOString()
      },
      ctaLink: `/customer/feedback/${feedbackId}`
    });

    return NextResponse.json({
      success: true,
      message: 'Feedback reply notification sent to customer'
    });
  } catch (error) {
    console.error('[Feedback Notification API] ❌ Error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
