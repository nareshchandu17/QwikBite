export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { IOrderItem } from "@/lib/models/Order";
import { getAuthCookie, verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Get token from cookie
    const token = getAuthCookie(req);
    
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // Connect to database
    await connectDB();

    // Get user's orders
    const orders = await (Order as any).find({ userId: decoded.id } as any).sort({ createdAt: -1 });

    return NextResponse.json({ 
      success: true,
      orders: orders.map((order: any) => ({
        id: order.id,
        total: order.total,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        timeSlot: order.timeSlot,
        createdAt: order.createdAt,
        items: order.items.map((item: IOrderItem) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      }))
    });
  } catch (error: any) {
    console.error("User orders error:", error);
    return NextResponse.json({ 
      error: "Server error", 
      details: error.message || "Unknown error occurred" 
    }, { status: 500 });
  }
}
