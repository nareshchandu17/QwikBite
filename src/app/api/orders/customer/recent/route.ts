import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/order.model";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const order = await Order.findOne({
      user: session.user.id,
      status: { $nin: ["completed", "cancelled"] },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!order) {
      return NextResponse.json({ success: true, order: null }, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.orderId || String(order._id),
        orderId: order.orderId,
        status: order.status,
        items: order.items,
        total: order.totalAmount,
        price: order.totalAmount,
        username: order.username,
        timeSlot: order.timeSlot,
        pickupDate: order.pickupDate,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch recent order" },
      { status: 500 },
    );
  }
}
