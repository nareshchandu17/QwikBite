import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/order.model";
import { successResponse, errorResponse } from "@/lib/api-response";
import logger from "@/lib/logger";
import {
  checkRateLimit,
  getRateLimitIdentifier,
  RateLimitPresets,
} from "@/lib/security/rateLimiter";
import {
  createOrderForUser,
  OrderServiceError,
} from "@/lib/services/orderService";
import { cache } from "@/lib/cache";
import { pusherServer } from "@/lib/pusher";
import { NotificationService } from "@/lib/services/notification.service";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const page = Math.max(
      1,
      Number(req.nextUrl.searchParams.get("page") || 1),
    );
    const limit = Math.min(
      100,
      Math.max(1, Number(req.nextUrl.searchParams.get("limit") || 20)),
    );
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ user: session.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ user: session.user.id }),
    ]);

    return successResponse({
      orders: orders.map((order) => ({
        ...order,
        id: order.orderId || String(order._id),
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Failed to fetch orders", error);
    return errorResponse("Failed to fetch orders", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await checkRateLimit(
      getRateLimitIdentifier(req),
      RateLimitPresets.ORDER.limit,
      RateLimitPresets.ORDER.windowMs,
    );

    if (!rateLimit.allowed) {
      return errorResponse(
        "Too many order attempts. Please try again later.",
        429,
        "RATE_LIMIT_EXCEEDED",
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const body = await req.json().catch(() => ({}));
    const paymentMethod = String(body.paymentMethod || "cod").toLowerCase();

    if (!["cod", "cash"].includes(paymentMethod)) {
      return errorResponse(
        "Online payments must use the secure payment-intent flow.",
        402,
        "PAYMENT_AUTHORIZATION_REQUIRED",
      );
    }

    const idempotencyKey =
      req.headers.get("idempotency-key") ||
      String(body.idempotencyKey || "") ||
      crypto.randomUUID();

    const result = await createOrderForUser({
      userId: session.user.id,
      items: Array.isArray(body.items) ? body.items : [],
      timeSlot: String(body.timeSlot || ""),
      pickupDate: body.pickupDate,
      paymentMethod: paymentMethod as "cod" | "cash",
      idempotencyKey,
      username: session.user.name || session.user.email || "Customer",
    });

    if (!result.reused) {
      cache.del("slots:available");

      try {
        await Promise.all([
          NotificationService.notifyAdmin({
            title: "New Order",
            message: `New order ${result.order.orderId} received`,
            type: "order",
          }),
          pusherServer.trigger("admin", "order:new", {
            order: result.order,
            timestamp: new Date().toISOString(),
          }),
          pusherServer.trigger("admin", "slot-update", {
            action: "order_created",
            orderId: result.order.orderId,
            timeSlot: result.order.timeSlot,
            timestamp: new Date().toISOString(),
          }),
        ]);
      } catch (notificationError) {
        logger.warn("Order real-time notification failed", notificationError);
      }
    }

    return successResponse(result.order, result.reused ? 200 : 201);
  } catch (error) {
    if (error instanceof OrderServiceError) {
      return errorResponse(error.message, error.status, error.code);
    }

    logger.error("Order creation failed", error);
    return errorResponse("Failed to create order", 500);
  }
}
