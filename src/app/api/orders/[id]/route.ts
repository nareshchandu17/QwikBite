import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/models/order.model';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

const jsonResponse = (data: unknown, status = 200) => {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) return jsonResponse({ error: 'Unauthorized' }, 401);
    const userId = session.user.id;

    // The 'id' in URL can be the orderId (ORD-...) or the MongoDB _id
    const order = await Order.findOne({
      $or: [
        { orderId: id },
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
      ]
    });

    if (!order) return jsonResponse({ error: 'Order not found' }, 404);
    
    // Check ownership or admin role
    if (order.user.toString() !== userId && session.user.role !== 'admin') {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }

    return jsonResponse({ order });
  } catch (err) {
    console.error('GET /api/orders/[id] error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) return jsonResponse({ error: 'Unauthorized' }, 401);
    const userId = session.user.id;

    const body = await req.json().catch(() => ({}));

    const order = await Order.findOne({
      $or: [
        { orderId: id },
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
      ]
    });

    if (!order) return jsonResponse({ error: 'Order not found' }, 404);
    
    if (order.user.toString() !== userId && session.user.role !== 'admin') {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }

    // Only allow specific status updates or meta updates
    const updated = await Order.findByIdAndUpdate(
      order._id,
      { $set: body },
      { new: true }
    ).lean();

    return jsonResponse({ data: updated });
  } catch (err) {
    console.error('PATCH /api/orders/[id] error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) return jsonResponse({ error: 'Unauthorized' }, 401);

    const order = await Order.findOne({
      $or: [
        { orderId: id },
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
      ]
    });

    if (!order) return jsonResponse({ error: 'Order not found' }, 404);
    
    if (order.user.toString() !== session.user.id && session.user.role !== 'admin') {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }

    await Order.findByIdAndDelete(order._id);
    return jsonResponse({ success: true });
  } catch (err) {
    console.error('DELETE /api/orders/[id] error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}
