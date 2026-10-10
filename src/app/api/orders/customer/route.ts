import logger from "@/lib/logger";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  createOrderForUser,
  OrderServiceError,
} from "@/lib/services/orderService";
import { errorResponse, successResponse } from "@/lib/api-response";
import { cache } from "@/lib/cache";
import { pusherServer } from "@/lib/pusher";
import { NotificationService } from "@/lib/services/notification.service";
import { Order } from "@/models/order.model";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const query: Record<string, string> = { user: session.user.id };
    const status = new URL(request.url).searchParams.get("status");
    if (status) query.status = status;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(orders);
  } catch (error) {
    logger.error("[Customer Orders GET] Error:", error);
    return errorResponse("Failed to fetch orders", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    const body = await request.json().catch(() => ({}));
    const paymentMethod = String(body.paymentMethod || "cod").toLowerCase();

    if (!["cod", "cash"].includes(paymentMethod)) {
      return errorResponse(
        "Online payment must be initialized through the secure payment-intent flow.",
        402,
        "PAYMENT_AUTHORIZATION_REQUIRED",
      );
    }

    const idempotencyKey =
      request.headers.get("idempotency-key") ||
      String(body.idempotencyKey || "") ||
      crypto.randomUUID();

    const result = await createOrderForUser({
      userId: session.user.id,
      items: Array.isArray(body.items) ? body.items : [],
      timeSlot: String(body.timeSlot || ""),
      pickupDate: body.pickupDate,
      paymentMethod: paymentMethod as "cod" | "cash",
      idempotencyKey,
      username:
        body.username ||
        session.user.name ||
        session.user.email ||
        "Customer",
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
        logger.warn(
          "[Customer Orders POST] Real-time notification failed",
          notificationError,
        );
      }
    }

    return successResponse(result.order, result.reused ? 200 : 201);
  } catch (error) {
    if (error instanceof OrderServiceError) {
      return errorResponse(error.message, error.status, error.code);
    }

    logger.error("[Customer Orders POST] Error:", error);
    return errorResponse("Failed to create order", 500);
  }
}
