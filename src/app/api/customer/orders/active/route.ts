import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthCookie, verifyToken } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { Order } from '@/lib/models/Order';

// Types
type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface Order {
  _id: string;
  id: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ApiResponse {
  success: boolean;
  activeOrder?: Order | null;
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Authentication
    const token = getAuthCookie(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken(token) as { id?: string } | null;
    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // Find active orders (not completed or cancelled)
    const activeOrder = await Order.findOne({
      userId: decoded.id,
      status: { $nin: ['completed', 'cancelled'] }
    })
    .sort({ createdAt: -1 }) // Get the most recent active order
    .lean() as unknown as Order; // Type assertion for lean() result

    if (activeOrder) {
      return NextResponse.json({
        success: true,
        activeOrder: {
          ...activeOrder,
          createdAt: activeOrder.createdAt?.toISOString?.() || activeOrder.createdAt,
          updatedAt: activeOrder.updatedAt?.toISOString?.() || activeOrder.updatedAt
        }
      });
    } else {
      return NextResponse.json({
        success: true,
        activeOrder: null
      });
    }

  } catch (error) {
    console.error('Error fetching active order:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
