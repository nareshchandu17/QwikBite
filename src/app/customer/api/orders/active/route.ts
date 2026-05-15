import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order, IOrder } from '@/lib/models/Order';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';

export const dynamic = "force-dynamic";

interface OrderDocument extends Omit<IOrder, '_id'> {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get session and verify user
    const session = await getServerSession(authConfig);
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Find the most recent active order
    const activeOrder = await Order.findOne({
      userId: userId,
      status: { $in: ['PENDING', 'PREPARING', 'READY_FOR_PICKUP'] }
    })
      .sort({ createdAt: -1 })
      .lean<OrderDocument>();

    return NextResponse.json({
      activeOrder: activeOrder ? {
        id: activeOrder._id.toString(),
        status: activeOrder.status,
        items: activeOrder.items,
        total: activeOrder.total,
        createdAt: activeOrder.createdAt.toISOString(),
        updatedAt: activeOrder.updatedAt.toISOString()
      } : null
    });
  } catch (error) {
    console.error('Error fetching active orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active orders' },
      { status: 500 }
    );
  }
}
