import { NextResponse } from "next/server";
import { Order, OrderItem } from "@/types/order";
import { v4 as uuidv4 } from "uuid";

// In-memory storage for payment orders (in production, use a database)
const paymentOrders: {
  [orderId: string]: {
    id: string;
    amount: number;
    status: "pending" | "completed" | "failed";
    items: OrderItem[];
    upiId: string;
    createdAt: Date;
  };
} = {};

// Create a new payment order
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, items, upiId } = body;

    // Validate required fields
    if (!amount || !items || !upiId) {
      return NextResponse.json(
        { error: "Amount, items, and UPI ID are required" },
        { status: 400 }
      );
    }

    // Validate amount
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items must be a non-empty array" },
        { status: 400 }
      );
    }

    // Generate order ID
    const orderId = `ORD-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Create payment order
    const paymentOrder = {
      id: orderId,
      amount,
      status: "pending" as const,
      items,
      upiId,
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
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating payment order:", error);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
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
        { status: 400 }
      );
    }

    const paymentOrder = paymentOrders[orderId];
    if (!paymentOrder) {
      return NextResponse.json(
        { error: "Payment order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order: paymentOrder,
    });
  } catch (error) {
    console.error("Error fetching payment order:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment order" },
      { status: 500 }
    );
  }
}

// Update payment order status
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { orderId, status } = body;

    // Validate required fields
    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Order ID and status are required" },
        { status: 400 }
      );
    }

    // Validate status
    if (status !== "completed" && status !== "failed") {
      return NextResponse.json(
        { error: "Status must be 'completed' or 'failed'" },
        { status: 400 }
      );
    }

    // Check if order exists
    const paymentOrder = paymentOrders[orderId];
    if (!paymentOrder) {
      return NextResponse.json(
        { error: "Payment order not found" },
        { status: 404 }
      );
    }

    // Update status
    paymentOrders[orderId] = {
      ...paymentOrder,
      status,
    };

    return NextResponse.json({
      success: true,
      orderId: paymentOrder.id,
      status: paymentOrders[orderId].status,
    });
  } catch (error) {
    console.error("Error updating payment order:", error);
    return NextResponse.json(
      { error: "Failed to update payment order" },
      { status: 500 }
    );
  }
}