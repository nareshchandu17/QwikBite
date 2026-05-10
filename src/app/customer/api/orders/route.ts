import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order, IOrder } from "@/lib/models/Order";
import { getAuthCookie } from "@/lib/auth";
import { verifyToken } from "@/lib/auth";
import { syncTimeSlotUsage } from "@/lib/slot-utils";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const q = url.searchParams.get("q");

    // Get user ID from auth cookie
    const token = getAuthCookie(request);
    
    const query: unknown = {};
    
    // If token exists, verify it and filter by user
    if (token) {
      const decoded = verifyToken(token);
      if (decoded && decoded.id) {
        query.userId = decoded.id;
      }
    }
    
    if (status && status !== "All") {
      // Support a simple Active alias
      if (status === "Active") {
        query.status = { $in: ["received", "preparing", "almost_ready", "ready"] };
      } else {
        query.status = status;
      }
    }
    
    if (q) {
      const lq = q.toLowerCase();
      query.$or = [
        { id: { $regex: lq, $options: 'i' } },
        { "items.name": { $regex: lq, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ orders });
  } catch (error: unknown) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { items, payment, timeSlot, userId, paymentIntentId, transactionId } = body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    // Calculate subtotal
    const subtotal = items.reduce((s: number, it: unknown) => s + (it.price || 0) * (it.quantity || 1), 0);
    
    // Generate order ID
    const orderId = `ORD-${Date.now()}`;
    
    // Create order document
    const orderData: IOrder = {
      id: orderId,
      userId: userId || "anonymous",
      createdAt: new Date(),
      items: items.map((it: unknown) => ({ 
        id: it.id || String(Date.now()),
        name: it.name || it.title, 
        quantity: it.quantity || 1, 
        price: it.price || 0,
        image: it.image || ""
      })),
      total: +(subtotal).toFixed(2),
      paymentMethod: payment,
      paymentStatus: "completed",
      status: "received",
      timeSlot: timeSlot || "Not specified",
      paymentIntentId: paymentIntentId,
      transactionId: transactionId,
      pickupDate: new Date().toISOString().split('T')[0] // Add pickupDate for today
    } as IOrder;

    const order = new Order(orderData);
    await order.save();
    
    // Sync time slot usage to update timeslots collection
    console.log(' Syncing time slot usage after order creation...');
    await syncTimeSlotUsage();
    console.log('✅ Time slot usage synced successfully');
    
    return NextResponse.json({ order }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

// Update order status
export async function PATCH(request: Request) {
  try {
    await connectDB();
    
    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');
    const body = await request.json();
    const { status } = body;
    
    if (!orderId || !status) {
      return NextResponse.json({ error: 'Missing orderId or status' }, { status: 400 });
    }
    
    const order = await Order.findOne({ id: orderId });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    order.status = status;
    await order.save();
    
    // Sync time slot usage if status changed (affects timeslots collection)
    console.log(' Syncing time slot usage after order status update...');
    await syncTimeSlotUsage();
    console.log(' Time slot usage synced successfully');
    
    return NextResponse.json({ order });
  } catch (error: unknown) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

// Submit feedback for an order
export async function PUT(request: Request) {
  try {
    await connectDB();
    
    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');
    const body = await request.json();
    const { rating, comment } = body;
    
    if (!orderId) {
      return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });
    }
    
    if (!rating) {
      return NextResponse.json({ error: 'Rating is required' }, { status: 400 });
    }
    
    const order = await Order.findOne({ id: orderId });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    order.feedbackGiven = true;
    order.rating = parseInt(rating);
    order.comment = comment;
    await order.save();
    
    return NextResponse.json({ order });
  } catch (error: unknown) {
    console.error("Error submitting feedback:", error);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
