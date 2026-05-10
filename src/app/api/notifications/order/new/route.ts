/**
 * POST /api/notifications/order/new
 * 
 * Called when a new order is created
 * Notifies all admins about the new order
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import NotificationService from '@/lib/services/notification.service';
import { User } from '@/lib/models/User';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { orderId, customerName, items, total, timeSlot } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId is required' },
        { status: 400 }
      );
    }

    // Get all admin users
    const admins = await User.find({ 
      role: { $in: ['admin', 'canteen_staff'] } 
    }).select('_id');

    const adminIds = admins.map(a => a._id.toString());

    // Send notification to admins
    await NotificationService.notifyAdmin({
      title: '📦 New Order Received',
      message: `New order from ${customerName || 'Customer'} for ${items?.length || 1} item(s) - ₹${total}`,
      type: 'order',
      priority: 'high',
      icon: '📦',
      data: {
        orderId,
        customerName,
        items,
        total,
        timeSlot,
        action: 'view_order'
      },
      ctaLink: `/admin/orders?id=${orderId}`,
      adminIds
    });

    return NextResponse.json({
      success: true,
      message: 'Admin notification sent'
    });
  } catch (error) {
    console.error('[Order Notification API] ❌ Error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
