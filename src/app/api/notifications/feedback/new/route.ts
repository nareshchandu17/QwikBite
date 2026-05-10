/**
 * POST /api/notifications/feedback/new
 * 
 * Called when a customer submits feedback
 * Notifies all admins about the feedback
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import NotificationService from '@/lib/services/notification.service';
import { User } from '@/lib/models/User';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { feedbackId, customerName, subject, message } = await req.json();

    if (!feedbackId || !subject || !message) {
      return NextResponse.json(
        { error: 'feedbackId, subject, and message are required' },
        { status: 400 }
      );
    }

    // Get all admins
    const admins = await User.find({ 
      role: { $in: ['admin', 'canteen_staff'] } 
    }).select('_id');

    const adminIds = admins.map(a => a._id.toString());

    // Send notification to admins
    await NotificationService.notifyAdmin({
      title: '📮 New Customer Feedback',
      message: `${customerName || 'Customer'} submitted feedback: "${subject}" - ${message.substring(0, 50)}...`,
      type: 'feedback',
      priority: 'normal',
      icon: '📮',
      data: {
        feedbackId,
        customerName,
        subject,
        message,
        timestamp: new Date().toISOString()
      },
      ctaLink: `/admin/feedback/${feedbackId}`,
      adminIds
    });

    return NextResponse.json({
      success: true,
      message: 'Feedback notification sent to admins'
    });
  } catch (error) {
    console.error('[Feedback Submission API] ❌ Error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
