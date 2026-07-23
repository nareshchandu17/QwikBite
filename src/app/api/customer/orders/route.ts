export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/models/order.model';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import mongoose from 'mongoose';
import { checkRateLimit, getRateLimitIdentifier, RateLimitPresets } from '@/lib/security/rateLimiter';
import { validateCSRFMiddleware } from '@/lib/security/csrf';
import { sanitizeString, sanitizeName, sanitizeNumber } from '@/lib/security/sanitizer';

interface ApiResponse {
  success: boolean;
  data?: unknown[] | Record<string, unknown>;
  orders?: unknown[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const user = await getAuthenticatedUser(request);
    
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting for GET requests (lenient)
    const identifier = getRateLimitIdentifier(request);
    const rateLimit = checkRateLimit(identifier, RateLimitPresets.LENIENT.limit, RateLimitPresets.LENIENT.windowMs);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    await connectDB();
    
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Math.min(Number(url.searchParams.get('limit') || '20'), 100);
    const status = url.searchParams.get('status');
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(user.id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const query: any = { user: user.id };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Order.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: orders,
      orders: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('[Customer Orders GET] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch orders' 
      },
      { status: 500 }
    );
  }
}

// POST - Create customer order
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const user = await getAuthenticatedUser(request);
    
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // CSRF validation for state-changing operations
    const csrfSecret = process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production';
    if (!validateCSRFMiddleware(request, csrfSecret)) {
      return NextResponse.json(
        { success: false, error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    // Rate limiting for order creation (strict)
    const identifier = getRateLimitIdentifier(request);
    const rateLimit = checkRateLimit(identifier, RateLimitPresets.ORDER.limit, RateLimitPresets.ORDER.windowMs);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many order attempts. Please try again later.' },
        { status: 429 }
      );
    }

    await connectDB();
    
    const body = await request.json();
    const { orderId, items, price, total, timeSlot, paymentMethod, username } = body;

    // Sanitize inputs
    const sanitizedOrderId = orderId ? sanitizeString(orderId) : `ORD-${Date.now()}`;
    const sanitizedUsername = username ? sanitizeName(username) : 'Customer';
    const sanitizedTimeSlot = timeSlot ? sanitizeString(timeSlot) : undefined;
    const sanitizedPaymentMethod = paymentMethod ? sanitizeString(paymentMethod) : 'online';
    const sanitizedTotal = sanitizeNumber(total || price);

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    // Sanitize order items
    const sanitizedItems = items.map((item: any) => ({
      menuItem: item.menuItem || item.id,
      name: sanitizeName(item.name),
      quantity: Math.max(1, Math.min(sanitizeNumber(item.quantity), 100)),
      price: sanitizeNumber(item.price),
      prepTime: item.prepTime || 5
    }));

    const newOrder = await Order.create({
      orderId: sanitizedOrderId,
      user: user.id,
      items: sanitizedItems,
      totalAmount: sanitizedTotal,
      total: sanitizedTotal,
      price: sanitizedTotal,
      status: 'pending',
      paymentStatus: (sanitizedPaymentMethod === 'cod' || sanitizedPaymentMethod === 'cash') ? 'pending' : 'paid',
      paymentMethod: sanitizedPaymentMethod,
      pickupTime: sanitizedTimeSlot ? new Date() : undefined,
      timeSlot: sanitizedTimeSlot,
      username: sanitizedUsername,
    });

    console.log(`✅ Customer Order Created: ${newOrder.orderId}`);

    return NextResponse.json({
      success: true,
      data: newOrder.toObject ? newOrder.toObject() : newOrder,
      order: newOrder.toObject ? newOrder.toObject() : newOrder
    } as any, { status: 201 });

  } catch (error) {
    console.error('[Customer Orders POST] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create order' 
      },
      { status: 500 }
    );
  }
}
