import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { Order, OrderStatus } from "@/models/order.model";
import { syncTimeSlotUsage } from "@/lib/slot-utils";
import { pusherServer, getOrderChannel } from "@/lib/pusher";
import { NotificationService } from "@/lib/services/notification.service";
import mongoose from "mongoose";

const STAFF_ROLES = new Set(["admin", "canteen_staff", "staff"]);

const TRANSITIONS: Record<string, Set<string>> = {
  [OrderStatus.PENDING]: new Set([OrderStatus.CONFIRMED, OrderStatus.CANCELLED]),
  [OrderStatus.CONFIRMED]: new Set([OrderStatus.PREPARING, OrderStatus.CANCELLED]),
  [OrderStatus.PREPARING]: new Set([OrderStatus.READY, OrderStatus.CANCELLED]),
  [OrderStatus.READY]: new Set([OrderStatus.COMPLETED]),
  [OrderStatus.COMPLETED]: new Set(),
  [OrderStatus.CANCELLED]: new Set(),
};

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const role = String(session?.user?.role || "").toLowerCase();

    if (!session?.user?.id || !STAFF_ROLES.has(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const body = await req.json().catch(() => ({}));
    const nextStatus = String(body.status || "").toLowerCase();

    if (!Object.values(OrderStatus).includes(nextStatus as OrderStatus)) {
      return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
    }

    const order = await Order.findById(params.id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === nextStatus) {
      return NextResponse.json({ order: order.toObject() }, { status: 200 });
    }

    if (!TRANSITIONS[order.status]?.has(nextStatus)) {
      return NextResponse.json(
        { error: `Invalid status transition: ${order.status} → ${nextStatus}` },
        { status: 409 },
      );
    }

    order.status = nextStatus;
    order.statusHistory.push({
      status: nextStatus,
      timestamp: new Date(),
      note: body.message || `Status updated to ${nextStatus}`,
      updatedBy: mongoose.isValidObjectId(session.user.id)
        ? new mongoose.Types.ObjectId(session.user.id)
        : undefined,
    });

    await order.save();

    if (order.pickupDate) {
      await syncTimeSlotUsage(order.pickupDate);
    }

    const publicOrderId = order.orderId || String(order._id);

    try {
      await pusherServer.trigger(
        getOrderChannel(publicOrderId),
        "order:update",
        {
          order: order.toObject(),
          status: order.status,
          timestamp: new Date().toISOString(),
        },
      );
    } catch (error) {
      logger.warn("Order status Pusher event failed", error);
    }

    try {
      await NotificationService.notifyCustomer({
        userId: String(order.user),
        title: "Order Status Update",
        message: `Order ${publicOrderId} is now ${order.status}.`,
        type: "order",
      });
    } catch (error) {
      logger.warn("Order notification failed", error);
    }

    return NextResponse.json({ order: order.toObject() }, { status: 200 });
  } catch (error) {
    logger.error("PUT /api/orders/[id]/status error", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 },
    );
  }
}
