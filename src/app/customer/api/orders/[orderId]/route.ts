import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { getAuthCookie, verifyToken } from "@/lib/auth";

// Get a specific order by ID
export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    await connectDB();
    
    // Authentication
    const token = getAuthCookie(request as any);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token) as { id?: string } | null;
    if (!decoded || !decoded.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    
    const { orderId } = await params;
    
    const order = await Order.findOne({ id: orderId, userId: decoded.id });
    
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    
    return NextResponse.json({ order });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

// Update order status
export async function PATCH(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    await connectDB();
    
    // Authentication
    const token = getAuthCookie(request as any);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token) as { id?: string } | null;
    if (!decoded || !decoded.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    
    const { orderId } = await params;
    const body = await request.json();
    const { status } = body;
    
    if (!status) return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    
    const order = await Order.findOne({ id: orderId, userId: decoded.id });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    
    order.status = status;
    await order.save();
    
    // Emit socket event for real-time updates
    // In a real implementation, you would emit to connected clients
    
    return NextResponse.json({ order });
  } catch (err) {
    console.error("Error updating order:", err);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

// Submit feedback for an order
export async function PUT(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    await connectDB();
    
    // Authentication
    const token = getAuthCookie(request as any);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token) as { id?: string } | null;
    if (!decoded || !decoded.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    
    const { orderId } = await params;
    const body = await request.json();
    const { rating, comment } = body;
    
    if (!rating) return NextResponse.json({ error: 'Rating is required' }, { status: 400 });
    
    const order = await Order.findOne({ id: orderId, userId: decoded.id });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    
    order.feedbackGiven = true;
    order.rating = parseInt(rating);
    order.comment = comment;
    await order.save();
    
    return NextResponse.json({ order });
  } catch (err) {
    console.error("Error submitting feedback:", err);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}