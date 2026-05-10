import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// In-memory storage for payment orders (in production, use a database)
interface PaymentOrder {
  id: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  items: unknown[];
  upiId: string;
  createdAt: Date;
}

const paymentOrders: { [orderId: string]: PaymentOrder } = {};

// Create a new payment order
export async function POST(request: Request) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400, headers: corsHeaders }
      );
    }

    const { amount, items, upiId } = body;

    // Validate required fields
    if (amount === undefined || amount === null) {
      return NextResponse.json(
        { error: "Amount is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Items must be an array" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!upiId || typeof upiId !== 'string' || upiId.trim().length === 0) {
      return NextResponse.json(
        { error: "UPI ID is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate amount
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate items
    if (items.length === 0) {
      return NextResponse.json(
        { error: "Items must be a non-empty array" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Sanitize UPI ID (basic validation)
    const sanitizedUpiId = upiId.trim();
    const upiIdRegex = /^[a-zA-Z0-9.\-_@]+$/;
    if (!upiIdRegex.test(sanitizedUpiId)) {
      return NextResponse.json(
        { error: "Invalid UPI ID format" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate and sanitize items
    const validatedItems = items.map((item: unknown, index: number) => {
      if (!item || typeof item !== 'object') {
        throw new Error(`Invalid item at index ${index}`);
      }
      return {
        id: String(item.id || `item-${index}`),
        name: String(item.name || 'Unknown Item').trim(),
        quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
        price: Math.max(0, Number(item.price) || 0),
      };
    });

    // Generate order ID
    const orderId = `ORD-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Create payment order
    const paymentOrder: PaymentOrder = {
      id: orderId,
      amount: numAmount,
      status: "pending",
      items: validatedItems,
      upiId: sanitizedUpiId,
      createdAt: new Date(),
    };

    // Store in memory (in production, save to database)
    paymentOrders[orderId] = paymentOrder;

    return NextResponse.json(
      {
        success: true,
        orderId: paymentOrder.id,
        amount: paymentOrder.amount,
        status: paymentOrder.status,
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error: unknown) {
    console.error("Error creating payment order:", error);
    return NextResponse.json(
      { 
        error: "Failed to create payment order",
        message: error?.message || 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Get payment order by ID
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Sanitize order ID
    const sanitizedOrderId = orderId.trim();

    const paymentOrder = paymentOrders[sanitizedOrderId];
    if (!paymentOrder) {
      return NextResponse.json(
        { error: "Payment order not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        order: paymentOrder,
      },
      { headers: corsHeaders }
    );
  } catch (error: unknown) {
    console.error("Error fetching payment order:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch payment order",
        message: error?.message || 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Update payment order status
export async function PUT(request: Request) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400, headers: corsHeaders }
      );
    }

    const { orderId, status } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!status || !['pending', 'completed', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: "Valid status is required (pending, completed, or failed)" },
        { status: 400, headers: corsHeaders }
      );
    }

    const paymentOrder = paymentOrders[orderId];
    if (!paymentOrder) {
      return NextResponse.json(
        { error: "Payment order not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    paymentOrder.status = status as "pending" | "completed" | "failed";

    return NextResponse.json(
      {
        success: true,
        order: paymentOrder,
      },
      { headers: corsHeaders }
    );
  } catch (error: unknown) {
    console.error("Error updating payment order:", error);
    return NextResponse.json(
      { 
        error: "Failed to update payment order",
        message: error?.message || 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

