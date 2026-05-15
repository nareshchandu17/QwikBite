import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order, OrderStatus, PaymentStatus } from '@/models/order.model';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const jsonResponse = (data: unknown, status = 200) => {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};

// GET - Fetch customer orders
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const query: any = { user: userId };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return jsonResponse(orders);
  } catch (error) {
    console.error('[Customer Orders GET] Error:', error);
    return jsonResponse({ error: 'Failed to fetch orders' }, 500);
  }
}

// POST - Create customer order
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const body = await request.json();
    const { orderId, items, price, timeSlot, paymentMethod } = body;

    const generatedOrderId = orderId || `ORD-${Date.now()}`;
    
    // Map fields to consolidated model
    const newOrder = await Order.create({
      orderId: generatedOrderId,
      user: session.user.id,
      items: Array.isArray(items) ? items.map((item: any) => ({
        menuItem: item.menuItem || item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        prepTime: item.prepTime || 5
      })) : [],
      totalAmount: price || 0,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      pickupTime: timeSlot ? new Date() : undefined, // Placeholder for now, should be parsed correctly
    });

    console.log(`✅ Customer Order Created: ${newOrder.orderId}`);

    // Notify Admins in Real-time and Store in DB
    try {
      const { NotificationService } = await import('@/lib/services/notificationService');
      await NotificationService.notifyAdminsNewOrder(newOrder);
    } catch (notifErr) {
      console.error('[Customer Orders POST] Notification error:', notifErr);
    }

    return jsonResponse(newOrder, 201);

  } catch (error) {
    console.error('❌ [Customer Orders POST] Detailed Error:', {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'UnknownError',
      code: (error as any).code,
      keyPattern: (error as any).keyPattern,
      keyValue: (error as any).keyValue,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return jsonResponse({ 
      error: 'Failed to create order', 
      details: error instanceof Error ? error.message : String(error),
      code: (error as any).code
    }, 500);
  }
}
