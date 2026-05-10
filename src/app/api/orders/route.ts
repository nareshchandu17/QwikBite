import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Order, OrderStatus, PaymentStatus } from '@/models/order.model';
import mongoose from 'mongoose';
import { syncTimeSlotUsage } from '@/lib/slot-utils';
import { socketManager } from '@/lib/websocket/server';
import { cache } from '@/lib/cache';
import { successResponse, errorResponse } from '@/lib/api-response';
import logger from '@/lib/logger';
import RateLimiter from '@/lib/middleware/rateLimiter';

// Initialize Rate Limiter: 10 orders per 15 minutes per IP
const orderLimiter = RateLimiter.getInstance(10, 15 * 60 * 1000);

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Math.min(Number(url.searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;

    const orders = await Order.find({ user: session.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return successResponse({ 
      orders,
      pagination: { page, limit }
    });
  } catch (err) {
    logger.error('Failed to fetch orders', err);
    return errorResponse('Failed to fetch orders', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    // 🛡️ 1. Rate Limiting
    const rateLimit = orderLimiter.isAllowed(req);
    if (!rateLimit.allowed) {
      return errorResponse('Too many order attempts. Please try again later.', 429, 'RATE_LIMIT_EXCEEDED');
    }

    await connectDB();
    const body = await req.json().catch(() => ({}));
    const { items, total, timeSlot, paymentStatus: bodyPaymentStatus } = body;

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
    }

    // 2. Input Validation
    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse('Order must contain at least one item', 400, 'INVALID_INPUT');
    }

    const { SlotService } = await import('@/lib/services/slotService');
    const orderLoad = await SlotService.calculateOrderLoad(items);

    const timingValidation = SlotService.validateSlotTiming(timeSlot, orderLoad);
    if (!timingValidation.valid) {
      return errorResponse(timingValidation.error || 'Invalid slot timing', 400, 'INVALID_SLOT');
    }

    // 3. Resource Allocation
    const todayStr = new Date().toISOString().split('T')[0];
    const reservedSlot = await SlotService.reserveSlot(timeSlot, todayStr, orderLoad);
    if (!reservedSlot) {
      return errorResponse('Time slot is full', 409, 'SLOT_FULL');
    }

    try {
      const order = await Order.create({
        user: session.user.id,
        items: items.map((item: unknown) => ({
            menuItem: item.id || item.menuItem,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            prepTime: item.prepTime || 5
        })),
        totalAmount: Number(total || 0),
        pickupTime: timeSlot ? new Date(`${todayStr}T${timeSlot}`) : undefined,
        status: OrderStatus.PENDING,
        paymentStatus: bodyPaymentStatus === 'paid' ? PaymentStatus.PAID : PaymentStatus.PENDING,
      });

      logger.info(`New Order Created: ${order.orderId}`, { userId: session.user.id });
      
      // 4. Notifications & Cache Busting
      socketManager.emitToAll('admin:new_order', order);
      cache.del('slots:available');

      return successResponse(order, 201);

    } catch (orderError: unknown) {
      await SlotService.releaseSlot(timeSlot, todayStr, orderLoad);
      throw orderError;
    }
  } catch (err) {
    logger.error('Order creation failed', err);
    return errorResponse('Failed to create order', 500);
  }
}
