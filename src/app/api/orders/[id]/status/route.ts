/**
 * PUT /api/orders/[id]/status
 * 
 * Updates order status and notifies customer
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/lib/models/Order';
import { getAuthCookie, verifyToken } from '@/lib/auth';
import mongoose from 'mongoose';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const jsonResponse = (data: unknown, status = 200) => {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return jsonResponse({ error: 'Invalid order ID' }, 400);
    }

    // Verify admin/staff role
    const token = getAuthCookie(req);
    if (!token) return jsonResponse({ error: 'Unauthorized' }, 401);

    const decoded = verifyToken(token);
    if (!decoded?.id) return jsonResponse({ error: 'Invalid token' }, 401);

    const body = await req.json().catch(() => ({}));
    const { status, message } = body;

    if (!status) {
      return jsonResponse({ error: 'status is required' }, 400);
    }

    // Update order status
    const order = await Order.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!order) {
      return jsonResponse({ error: 'Order not found' }, 404);
    }

    console.log(`✅ Order status updated to: ${status}`);

    // Send customer notification about order status
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/order/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          userId: order.user?.toString() || '',
          status,
          message: message || `Your order is now ${status}`
        })
      });
      console.log('✅ Customer notification sent for order status update');
    } catch (notifError) {
      console.warn('⚠️ Failed to send customer notification:', notifError);
    }

    return jsonResponse({ order }, 200);
  } catch (err) {
    console.error('PUT /api/orders/[id]/status error:', err);
    return jsonResponse({ error: 'Failed to update order status' }, 500);
  }
}
