import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { Order, OrderStatus } from "@/models/order.model";
import { SlotService } from "@/lib/services/slotService";
import { pusherServer } from "@/lib/pusher";
import { AuditService } from "@/lib/services/auditService";
import { NotificationService } from "@/lib/services/notification.service";
import mongoose from "mongoose";
import { sanitizeString } from "@/lib/security/sanitizer";
import { checkRateLimit, getRateLimitIdentifier, RateLimitPresets } from "@/lib/security/rateLimiter";

const STAFF_ROLES = new Set(["admin", "canteen_staff", "staff"]);
const TRANSITIONS: Record<string, Set<string>> = {
  pending: new Set(["confirmed", "cancelled"]),
  confirmed: new Set(["preparing", "cancelled"]),
  preparing: new Set(["ready", "cancelled"]),
  ready: new Set(["completed"]),
  completed: new Set(),
  cancelled: new Set(),
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

async function getStaffSession() {
  const session = await getServerSession(authOptions);
  const role = String(session?.user?.role || "").toLowerCase();
  if (!session?.user?.id || !STAFF_ROLES.has(role)) return null;
  return session;
}

async function resolveOrder(id: string) {
  const filter = {
    $or: [
      { orderId: id },
      ...(mongoose.isValidObjectId(id) ? [{ _id: id }] : []),
    ],
  };
  return Order.findOne(filter);
}

async function transitionOrder(id: string, nextStatus: string, note: string | undefined, actorId: string) {
  const order = await resolveOrder(id);
  if (!order) return { ok: false as const, status: 404, error: "Order not found" };
  const currentStatus = String(order.status);
  const allowed = TRANSITIONS[currentStatus]?.has(nextStatus);
  if (!allowed) {
    return {
      ok: false as const,
      status: 409,
      error: `Invalid status transition from ${currentStatus} to ${nextStatus}.`,
    };
  }

  const now = new Date();
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: currentStatus },
    {
      $set: { status: nextStatus, isCancelled: nextStatus === "cancelled" },
      $push: {
        statusHistory: {
          status: nextStatus,
          timestamp: now,
          note: note ? sanitizeString(note) : `Status updated to ${nextStatus}`,
          updatedBy: mongoose.isValidObjectId(actorId) ? new mongoose.Types.ObjectId(actorId) : undefined,
        },
      },
    },
    { new: true },
  );

  if (!updated) return { ok: false as const, status: 409, error: "Order changed; refresh and retry." };

  if (nextStatus === "cancelled" && updated.pickupDate && updated.timeSlot && updated.loadValue) {
    await SlotService.releaseSlot(updated.timeSlot, updated.pickupDate, updated.loadValue);
  }

  const publicOrderId = updated.orderId || String(updated._id);
  try {
    await pusherServer.trigger("order-" + publicOrderId.replace(/:/g, "-"), "order:update", {
      order: updated.toObject(),
      status: updated.status,
      timestamp: now.toISOString(),
    });
    await pusherServer.trigger("admin", "admin:order_updated", updated.toObject());
  } catch (error) {
    logger.warn("Failed to publish order transition", error);
  }

  try {
    await NotificationService.notifyCustomer({
      userId: String(updated.user),
      title: "Order Status Update",
      message: `Order ${publicOrderId} is now ${updated.status}.`,
      type: "order",
    });
  } catch (error) {
    logger.warn("Failed to notify order owner", error);
  }

  return { ok: true as const, order: updated };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getStaffSession();
    if (!session) return json({ error: "Forbidden" }, 403);

    const limitCheck = await checkRateLimit(getRateLimitIdentifier(req), RateLimitPresets.STANDARD.limit, RateLimitPresets.STANDARD.windowMs);
    if (!limitCheck.allowed) return json({ error: "Rate limit exceeded" }, 429);

    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50)));
    const query: Record<string, any> = {};
    if (status && Object.values(OrderStatus).includes(status as OrderStatus)) query.status = status;
    if (search) {
      const safe = search.replace(/[.*+?^{}$()|[\]\\]/g, "\\$&");
      query.$or = [{ orderId: { $regex: safe, $options: "i" } }, { username: { $regex: safe, $options: "i" } }];
    }
    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("user", "name email phone").populate("slot").lean(),
      Order.countDocuments(query),
    ]);

    const data = orders.map((order: any) => ({
      ...order,
      id: order.orderId || String(order._id),
      total: order.totalAmount || order.total || 0,
      customerName: order.user?.name || order.username || "Customer",
      customerEmail: order.user?.email,
      customerPhone: order.user?.phone,
    }));

    return json({ data, pagination: { total, page, limit, pages: Math.ceil(total / limit), hasMore: page * limit < total } });
  } catch (error) {
    logger.error("Admin Orders GET Error", error);
    return json({ error: "Failed to fetch orders" }, 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getStaffSession();
    if (!session) return json({ error: "Forbidden" }, 403);
    const limitCheck = await checkRateLimit(getRateLimitIdentifier(req), RateLimitPresets.STANDARD.limit, RateLimitPresets.STANDARD.windowMs);
    if (!limitCheck.allowed) return json({ error: "Rate limit exceeded" }, 429);

    const body = await req.json().catch(() => ({}));
    const id = sanitizeString(String(body.id || ""));
    const status = sanitizeString(String(body.status || "")).toLowerCase();
    const note = body.note ? sanitizeString(String(body.note)) : undefined;
    if (!id || !Object.values(OrderStatus).includes(status as OrderStatus)) return json({ error: "Order ID and a valid status are required" }, 400);

    await connectDB();
    const result = await transitionOrder(id, status, note, session.user.id);
    if (!result.ok) return json({ error: result.error }, result.status);

    try {
      await AuditService.log({
        action: "UPDATE", entityType: "ORDER", entityId: result.order.orderId, entityName: "Order " + result.order.orderId,
        userId: session.user.id, userEmail: session.user.email || "", userRole: session.user.role,
        changes: { status }, description: "Order " + result.order.orderId + " changed to " + status, severity: "LOW",
        ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown",
      });
    } catch (error) { logger.warn("Audit log failed", error); }

    return json({ data: result.order.toObject() });
  } catch (error) {
    logger.error("Admin Orders PATCH Error", error);
    return json({ error: "Failed to update order" }, 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getStaffSession();
    if (!session) return json({ error: "Forbidden" }, 403);
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const id = sanitizeString(String(body.id || ""));
    const note = sanitizeString(String(body.note || ""));
    if (!id || !note) return json({ error: "Order ID and note are required" }, 400);
    const order = await resolveOrder(id);
    if (!order) return json({ error: "Order not found" }, 404);
    order.statusHistory.push({ status: order.status, timestamp: new Date(), note, updatedBy: mongoose.isValidObjectId(session.user.id) ? new mongoose.Types.ObjectId(session.user.id) : undefined });
    await order.save();
    return json({ data: order.toObject() });
  } catch (error) {
    logger.error("Admin Orders PUT Error", error);
    return json({ error: "Failed to add order note" }, 500);
  }
}

export async function POST(req: NextRequest) {
  const session = await getStaffSession();
  if (!session) return json({ error: "Forbidden" }, 403);
  const body = await req.json().catch(() => ({}));

  if (body?.bulk && Array.isArray(body.orderIds) && body.status) {
    if (body.orderIds.length > 50) return json({ error: "Maximum 50 orders per bulk action" }, 400);
    await connectDB();
    const status = sanitizeString(String(body.status)).toLowerCase();
    if (!Object.values(OrderStatus).includes(status as OrderStatus)) return json({ error: "Invalid status" }, 400);
    const results: Array<{ id: string; success: boolean; orderId?: string; error?: string }> = [];
    for (const rawId of body.orderIds) {
      const id = sanitizeString(String(rawId));
      const result = await transitionOrder(id, status, body.note ? String(body.note) : undefined, session.user.id);
      results.push(result.ok ? { id, success: true, orderId: result.order.orderId } : { id, success: false, error: result.error });
    }
    return json({ success: true, results, successCount: results.filter((item) => item.success).length, errorCount: results.filter((item) => !item.success).length });
  }

  return json({ error: "Direct order creation is disabled. Customer orders must use the validated checkout service." }, 410);
}

export const dynamic = "force-dynamic";