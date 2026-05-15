export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthCookie, verifyToken } from '@/lib/auth';
import { Order } from '@/lib/models/Order';
import mongoose from 'mongoose';

// GET /api/orders/customer/recent - Get most recent order for customer
export async function GET(req: NextRequest) {
  try {
    console.log('[Recent Orders API] GET request received');

    // Authentication check
    let userId = null;

    // Method 1: Check Authorization header first
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('[Recent Orders API] Found token in Authorization header');

      try {
        const decoded = verifyToken(token);
        if (decoded?.id) {
          userId = decoded.id;
          console.log('[Recent Orders API] ✅ Auth successful via header, user:', userId);
        }
      } catch (error) {
        console.log('[Recent Orders API] Header token verification failed');
      }
    }

    // Method 2: Check cookies
    if (!userId) {
      // Check NextAuth session first
      try {
        // Dynamic import to avoid circular dependencies if any
        const { getServerSession } = await import("next-auth");
        const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");

        const session = await getServerSession(authOptions);
        if (session?.user?.id) {
          userId = session.user.id;
          console.log('[Recent Orders API] ✅ Auth successful via NextAuth session, user:', userId);
        }
      } catch (error) {
        console.log('[Recent Orders API] NextAuth session check failed:', error);
      }

      // Then check custom auth cookie if still no user
      if (!userId) {
        const token = getAuthCookie(req);
        if (token) {
          console.log('[Recent Orders API] Found token in cookie');

          try {
            const decoded = verifyToken(token);
            if (decoded?.id) {
              userId = decoded.id;
              console.log('[Recent Orders API] ✅ Auth successful via cookie, user:', userId);
            }
          } catch (error) {
            console.log('[Recent Orders API] Cookie token verification failed');
          }
        }
      }
    }

    if (!userId) {
      console.log('[Recent Orders API] No auth token found in cookie or header');
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required to access order data'
      }, { status: 401 });
    }

    console.log('[Recent Orders API] User authenticated:', userId);

    await connectDB();

    // Find the most recent order for this user
    const recentOrder = await Order.findOne({
      userId: new mongoose.Types.ObjectId(userId)
    })
      .sort({ createdAt: -1 })
      .limit(1);

    console.log('[Recent Orders API] Recent order query result:', recentOrder ? 'Found' : 'Not found');

    if (!recentOrder) {
      return NextResponse.json({
        success: false,
        message: 'No orders found for this user'
      }, { status: 200 });
    }

    console.log('[Recent Orders API] ✅ Recent order found:', {
      id: recentOrder.id,
      status: recentOrder.status,
      total: recentOrder.total,
      createdAt: recentOrder.createdAt
    });

    return NextResponse.json({
      success: true,
      order: {
        id: recentOrder.id,
        orderId: recentOrder.orderId,
        status: recentOrder.status,
        items: recentOrder.items,
        total: recentOrder.total,
        price: recentOrder.price,
        username: recentOrder.username,
        timeSlot: recentOrder.timeSlot,
        paymentMethod: recentOrder.paymentMethod,
        paymentStatus: recentOrder.paymentStatus,
        createdAt: recentOrder.createdAt,
        updatedAt: recentOrder.updatedAt
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('[Recent Orders API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal Server Error',
      message: 'Failed to fetch recent orders'
    }, { status: 500 });
  }
}
