import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import mongoose from 'mongoose';
import { Order, IOrder } from '@/lib/models/Order';

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
  orders: Order[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Authentication with NextAuth - handle errors gracefully
    let session = null;
    try {
      session = await getServerSession(authConfig);
    } catch (authError) {
      console.error('Authentication error in orders API:', authError);
      // Continue without session for development/testing
    }
    
    // For development, allow access without authentication
    if (!session || !session.user?.id) {
      console.log('Orders API: No session found, returning empty orders array');
      return NextResponse.json(
        { success: true, orders: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } },
        { status: 200 }
      );
    }

    const userId = session.user.id;
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status')?.split(',').filter(Boolean) as OrderStatus[] | undefined;
    const paymentStatus = searchParams.get('paymentStatus')?.split(',').filter(Boolean) as PaymentStatus[] | undefined;
    const search = searchParams.get('search')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const skip = (page - 1) * limit;

    // Connect to database using Mongoose
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    // Build query for Mongoose
    const query: unknown = { userId };

    // Status filter
    if (status?.length) {
      query.status = { $in: status };
    }

    // Payment status filter
    if (paymentStatus?.length) {
      query.paymentStatus = { $in: paymentStatus };
    }

    // Search filter
    if (search) {
      query.$or = [
        { id: { $regex: search, $options: 'i' } },
        { 'items.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count for pagination
    const total = await Order.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Fetch orders with pagination and sorting using Mongoose
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      orders: orders.map((order: unknown) => ({
        _id: order._id?.toString() || '',
        id: order.id || '',
        userId: order.userId || '',
        status: order.status || 'pending',
        paymentStatus: order.paymentStatus || 'pending',
        items: order.items || [],
        total: order.total || 0,
        createdAt: order.createdAt || new Date(),
        updatedAt: order.updatedAt || new Date()
      })),
      meta: {
        total,
        page,
        limit,
        totalPages
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { 
        success: false, 
        orders: [], 
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 }, 
        error: 'Failed to fetch orders' 
      },
      { status: 500 }
    );
  }
}
