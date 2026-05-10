import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/lib/models/Order';

// GET /api/debug/orders - Debug endpoint to check all orders
export async function GET(req: NextRequest) {
  try {
    console.log('[Debug Orders] Fetching all orders from database...');
    
    await connectDB();
    
    // Get all orders with their IDs
    const orders = await Order.find({})
      .select('id orderId status total createdAt username')
      .sort({ createdAt: -1 })
      .limit(20);
    
    console.log('[Debug Orders] Found orders:', orders.length);
    
    return NextResponse.json({
      success: true,
      count: orders.length,
      orders: orders.map(order => ({
        id: order.id,
        orderId: order.orderId,
        status: order.status,
        total: order.total,
        username: order.username,
        createdAt: order.createdAt,
        hasOrderId: !!order.orderId
      }))
    }, { status: 200 });
    
  } catch (error: unknown) {
    console.error('[Debug Orders] Error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fetch orders'
    }, { status: 500 });
  }
}
