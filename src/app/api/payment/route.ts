import { NextResponse, NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { connectDB } from "@/lib/db";
import Payment, { PaymentStatus, PaymentMethod } from "@/lib/models/Payment";
import { verifyAuth, createSecureResponse } from "@/lib/middleware/auth";
import RateLimiter from "@/lib/middleware/rateLimiter";
import { pusherServer } from "@/lib/pusher";

// Connect to database
await connectDB();

// Rate limiter instance
const rateLimiter = RateLimiter.getInstance(100, 15 * 60 * 1000);

// Security middleware wrapper
async function withSecurity(request: NextRequest, handler: (req: NextRequest) => Promise<NextResponse>) {
  // Apply rate limiting
  const rateLimitResult = rateLimiter.isAllowed(request);
  const headers = rateLimiter.createRateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Rate limit exceeded. Try again in ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds.`,
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      },
      {
        status: 429,
        headers: {
          ...headers,
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
        }
      }
    );
  }

  // Apply authentication
  const authResult = await verifyAuth(request);
  
  if (!authResult.success) {
    return createSecureResponse(authResult, 401);
  }

  return handler(request);
}

// Create a new payment order
export async function POST(request: NextRequest) {
  return withSecurity(request, async (req: NextRequest) => {
    try {
      // Parse request body
      let body;
      try {
        body = await req.json();
      } catch (parseError) {
        return NextResponse.json(
          { error: "Invalid JSON in request body" },
          { status: 400 }
        );
      }

      const { amount, items, upiId, customerName, customerEmail, customerPhone, orderId } = body;

      // Validate required fields
      if (amount === undefined || amount === null) {
        return NextResponse.json(
          { error: "Amount is required" },
          { status: 400 }
        );
      }

      if (!items || !Array.isArray(items)) {
        return NextResponse.json(
          { error: "Items must be an array" },
          { status: 400 }
        );
      }

      if (!customerName || typeof customerName !== 'string' || customerName.trim().length === 0) {
        return NextResponse.json(
          { error: "Customer name is required" },
          { status: 400 }
        );
      }

      // Validate amount
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return NextResponse.json(
          { error: "Amount must be a positive number" },
          { status: 400 }
        );
      }

      // Validate items
      if (items.length === 0) {
        return NextResponse.json(
          { error: "Items must be a non-empty array" },
          { status: 400 }
        );
      }

      // Sanitize UPI ID if provided
      let sanitizedUpiId: string | undefined;
      if (upiId) {
        sanitizedUpiId = upiId.trim();
        const upiIdRegex = /^[a-zA-Z0-9.\-_@]+$/;
        if (!upiIdRegex.test(sanitizedUpiId || '')) {
          return NextResponse.json(
            { error: "Invalid UPI ID format" },
            { status: 400 }
          );
        }
      }

      // Validate and sanitize items
      const validatedItems = items.map((item: unknown, index: number) => {
        if (!item || typeof item !== 'object') {
          throw new Error(`Invalid item at index ${index}`);
        }
        return {
          id: String((item as any).id || `item-${index}`),
          name: String((item as any).name || 'Unknown Item').trim(),
          quantity: Math.max(1, Math.floor(Number((item as any).quantity) || 1)),
          price: Math.max(0, Number((item as any).price) || 0),
        };
      });

      // Generate transaction ID
      const transactionId = `TXN-${uuidv4().substring(0, 8).toUpperCase()}`;
      const finalOrderId = orderId || `ORD-${uuidv4().substring(0, 8).toUpperCase()}`;

      // Determine payment method
      const method = sanitizedUpiId ? PaymentMethod.UPI : PaymentMethod.CASH;

      // Create payment record
      const payment = await Payment.create({
        transactionId,
        orderId: finalOrderId,
        customerName: customerName.trim(),
        customerEmail: customerEmail?.trim(),
        customerPhone: customerPhone?.trim(),
        amount: numAmount,
        currency: 'INR',
        method,
        status: PaymentStatus.PENDING,
        upiId: sanitizedUpiId,
        items: validatedItems,
      });

      // Emit real-time notification
      try {
        await pusherServer.trigger('admin', 'payment_update', {
          type: 'payment_created',
          payment: payment.toObject(),
          timestamp: new Date()
        });
      } catch (pusherError) {
        console.error('Failed to send Pusher notification:', pusherError);
      }

      return NextResponse.json(
        {
          success: true,
          transactionId: payment.transactionId,
          orderId: payment.orderId,
          amount: payment.amount,
          status: payment.status,
        },
        { status: 201 }
      );
    } catch (error: unknown) {
      console.error("Error creating payment order:", error);
      return NextResponse.json(
        { 
          error: "Failed to create payment order",
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  });
}

// Get payment order by ID
export async function GET(request: NextRequest) {
  return withSecurity(request, async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const transactionId = searchParams.get("transactionId");
      const orderId = searchParams.get("orderId");

      if (!transactionId && !orderId) {
        return NextResponse.json(
          { error: "Transaction ID or Order ID is required" },
          { status: 400 }
        );
      }

      let payment;
      if (transactionId) {
        payment = await Payment.findOne({ transactionId: transactionId.trim() });
      } else if (orderId) {
        payment = await Payment.findOne({ orderId: orderId.trim() });
      }

      if (!payment) {
        return NextResponse.json(
          { error: "Payment not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        payment: payment.toObject(),
      });
    } catch (error: unknown) {
      console.error("Error fetching payment:", error);
      return NextResponse.json(
        { 
          error: "Failed to fetch payment",
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  });
}

// Update payment order status
export async function PUT(request: NextRequest) {
  return withSecurity(request, async (req: NextRequest) => {
    try {
      // Parse request body
      let body;
      try {
        body = await req.json();
      } catch (parseError) {
        return NextResponse.json(
          { error: "Invalid JSON in request body" },
          { status: 400 }
        );
      }

      const { transactionId, status } = body;

      if (!transactionId) {
        return NextResponse.json(
          { error: "Transaction ID is required" },
          { status: 400 }
        );
      }

      if (!status || !Object.values(PaymentStatus).includes(status)) {
        return NextResponse.json(
          { error: `Valid status is required (${Object.values(PaymentStatus).join(', ')})` },
          { status: 400 }
        );
      }

      const payment = await Payment.findOne({ transactionId: transactionId.trim() });
      if (!payment) {
        return NextResponse.json(
          { error: "Payment not found" },
          { status: 404 }
        );
      }

      payment.status = status;
      await payment.save();

      // Emit real-time notification
      try {
        await pusherServer.trigger('admin', 'payment_update', {
          type: 'payment_updated',
          payment: payment.toObject(),
          timestamp: new Date()
        });
      } catch (pusherError) {
        console.error('Failed to send Pusher notification:', pusherError);
      }

      return NextResponse.json({
        success: true,
        payment: payment.toObject(),
      });
    } catch (error: unknown) {
      console.error("Error updating payment:", error);
      return NextResponse.json(
        { 
          error: "Failed to update payment",
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  });
}

