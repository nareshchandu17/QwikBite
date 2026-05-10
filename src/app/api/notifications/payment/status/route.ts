/**
 * POST /api/notifications/payment/status
 * 
 * Called when payment status changes
 * Notifies admin about payment success/failure
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import NotificationService from '@/lib/services/notification.service';
import { User } from '@/lib/models/User';

const paymentMessages: { [key: string]: { title: string; icon: string; priority: 'high' | 'normal' } } = {
  'completed': { 
    title: '💳 Payment Successful',
    icon: '✅',
    priority: 'high'
  },
  'pending': { 
    title: '⏳ Payment Pending',
    icon: '⏳',
    priority: 'normal'
  },
  'failed': { 
    title: '❌ Payment Failed',
    icon: '❌',
    priority: 'high'
  }
};

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { orderId, amount, status, method, message } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'orderId and status are required' },
        { status: 400 }
      );
    }

    const paymentInfo = paymentMessages[status] || {
      title: `💳 Payment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      icon: '💳',
      priority: 'normal'
    };

    // Get all admins
    const admins = await User.find({ 
      role: { $in: ['admin', 'canteen_staff'] } 
    }).select('_id');

    const adminIds = admins.map(a => a._id.toString());

    // Send notification to admins
    await NotificationService.notifyAdmin({
      title: paymentInfo.title,
      message: message || `Payment ${status} for order ${orderId} - ₹${amount} via ${method}`,
      type: 'payment',
      priority: paymentInfo.priority,
      icon: paymentInfo.icon,
      data: {
        orderId,
        amount,
        status,
        method,
        timestamp: new Date().toISOString()
      },
      ctaLink: `/admin/payments?order=${orderId}`,
      adminIds
    });

    return NextResponse.json({
      success: true,
      message: 'Payment notification sent to admins'
    });
  } catch (error) {
    console.error('[Payment Notification API] ❌ Error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
