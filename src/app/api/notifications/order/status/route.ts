/**
 * POST /api/notifications/order/status
 * 
 * Called when order status changes
 * Notifies the customer about status updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import NotificationService from '@/lib/services/notification.service';
import mongoose from 'mongoose';

const statusMessages: { [key: string]: { title: string; icon: string } } = {
  'received': { 
    title: '✅ Order Received',
    icon: '✅'
  },
  'preparing': { 
    title: '🍳 Preparing Your Order',
    icon: '🍳'
  },
  'ready': { 
    title: '🎉 Ready to Pick Up',
    icon: '🎉'
  },
  'collected': { 
    title: '✔️ Order Collected',
    icon: '✔️'
  },
  'cancelled': { 
    title: '❌ Order Cancelled',
    icon: '❌'
  }
};

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { orderId, userId, status, message } = await req.json();

    if (!orderId || !userId || !status) {
      return NextResponse.json(
        { error: 'orderId, userId, and status are required' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Invalid userId' },
        { status: 400 }
      );
    }

    const statusInfo = statusMessages[status] || {
      title: `📦 Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      icon: '📦'
    };

    // Send notification to customer
    await NotificationService.notifyCustomer({
      userId,
      title: statusInfo.title,
      message: message || `Your order ${orderId} is now ${status}`,
      type: 'order',
      priority: status === 'ready' ? 'high' : 'normal',
      icon: statusInfo.icon,
      data: {
        orderId,
        status,
        timestamp: new Date().toISOString()
      },
      ctaLink: `/customer/orders/${orderId}`
    });

    return NextResponse.json({
      success: true,
      message: 'Customer notification sent'
    });
  } catch (error) {
    console.error('[Order Status Notification API] ❌ Error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
