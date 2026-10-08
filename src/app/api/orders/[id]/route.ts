import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order, OrderStatus } from "@/models/order.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";
import { syncTimeSlotUsage } from "@/lib/slot-utils";

const STAFF_ROLES = new Set(["admin", "canteen_staff", "staff"]);

function orderFilter(id: string) {
  return {
    $or: [
      { orderId: id },
      ...(mongoose.isValidObjectId(id) ? [{ _id: id }] : []),
    ],
  };
}

async function cancelOrder(
  order: mongoose.HydratedDocument<any>,
  actorId: string,
) {
  if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
    return { ok: false, status: 409, error: "This order can no longer be cancelled." };
  }

  order.status = OrderStatus.CANCELLED;
  order.isCancelled = true;
  order.statusHistory.push({
    status: OrderStatus.CANCELLED,
    timestamp: new Date(),
    note: "Order cancelled",
    updatedBy: mongoose.isValidObjectId(actorId)
      ? new mongoose.Types.ObjectId(actorId)
      : undefined,
  });

  await order.save();

  if (order.pickupDate) {
    await syncTimeSlotUsage(order.pickupDate);
  }

  return { ok: true, status: 200, data: order.toObject() };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await Order.findOne(orderFilter(params.id)).lean();
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const role = String(session.user.role || "").toLowerCase();
    const isOwner = String(order.user) === session.user.id;

    if (!isOwner && !STAFF_ROLES.has(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    logger.error("GET /api/orders/[id] error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await Order.findOne(orderFilter(params.id));
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const role = String(session.user.role || "").toLowerCase();
    const body = await req.json().catch(() => ({}));

    if (body.action === "cancel") {
      if (String(order.user) !== session.user.id && !STAFF_ROLES.has(role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const result = await cancelOrder(order, session.user.id);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }

      return NextResponse.json({ data: result.data }, { status: 200 });
    }

    if (!STAFF_ROLES.has(role)) {
      return NextResponse.json(
        { error: "Only canteen staff can edit operational order fields." },
        { status: 403 },
      );
    }

    const allowedFields = ["assignedStaff", "estimatedReadyTime", "chefMessage"];
    const update: Record<string, unknown> = {};

    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        update[key] = body[key];
      }
    }

    if (!Object.keys(update).length) {
      return NextResponse.json(
        { error: "No supported fields were supplied." },
        { status: 400 },
      );
    }

    Object.assign(order, update);
    await order.save();

    return NextResponse.json({ data: order.toObject() }, { status: 200 });
  } catch (error) {
    logger.error("PATCH /api/orders/[id] error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await Order.findOne(orderFilter(params.id));
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const role = String(session.user.role || "").toLowerCase();
    if (String(order.user) !== session.user.id && !STAFF_ROLES.has(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await cancelOrder(order, session.user.id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 200 });
  } catch (error) {
    logger.error("DELETE /api/orders/[id] error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
