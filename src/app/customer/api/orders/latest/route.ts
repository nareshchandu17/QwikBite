export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order, IOrder } from '@/lib/models/Order';
import { getAuthCookie } from '@/lib/auth';
import { verifyToken } from '@/lib/auth';

interface OrderDocument extends Omit<IOrder, '_id'> {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get user ID from auth cookie
    const token = getAuthCookie(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded?.id) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Find the most recent order for the user
    const latestOrder = await Order.findOne({ userId: decoded.id })
      .sort({ createdAt: -1 }) // Sort by creation date descending
      .lean<OrderDocument>();
    
    if (!latestOrder) {
      return NextResponse.json({ order: null });
    }

    // Convert to plain object and format the response
    const orderData = {
      id: latestOrder._id.toString(),
      status: latestOrder.status,
      items: latestOrder.items,
      total: latestOrder.total,
      createdAt: latestOrder.createdAt.toISOString()
    };
    
    return NextResponse.json({ order: orderData });
  } catch (error) {
    console.error('Error fetching latest order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch latest order' },
      { status: 500 }
    );
  }
}
