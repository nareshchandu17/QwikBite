import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Order } from "@/models/order.model";
import {
  createOrderForUser,
  OrderServiceError,
} from "@/lib/services/orderService";
import {
  checkRateLimit,
  getRateLimitIdentifier,
  RateLimitPresets,
} from "@/lib/security/rateLimiter";

let stripe: Stripe | null = null;

function getStripeInstance(): Stripe {
  if (!stripe) {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) throw new Error("STRIPE_SECRET_KEY is not configured");
    stripe = new Stripe(secret);
  }
  return stripe;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = await checkRateLimit(
      getRateLimitIdentifier(request),
      RateLimitPresets.ORDER.limit,
      RateLimitPresets.ORDER.windowMs,
    );

    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many payment attempts." }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const idempotencyKey =
      request.headers.get("idempotency-key") ||
      String(body.idempotencyKey || "") ||
      crypto.randomUUID();

    let order = await Order.findOne({
      user: session.user.id,
      idempotencyKey,
    });

    if (order?.paymentStatus === "paid") {
      return NextResponse.json(
        { error: "This order has already been paid.", orderId: order.orderId },
        { status: 409 },
      );
    }

    if (!order) {
      if (!Array.isArray(body.items) || !body.items.length) {
        return NextResponse.json(
          { error: "Cart items are required." },
          { status: 400 },
        );
      }

      const created = await createOrderForUser({
        userId: session.user.id,
        items: body.items,
        timeSlot: String(body.timeSlot || ""),
        pickupDate: body.pickupDate,
        paymentMethod: "stripe",
        idempotencyKey,
        username: session.user.name || session.user.email || "Customer",
      });

      order = await Order.findById(created.order._id);
    }

    if (!order) throw new Error("Failed to create payment order");

    const stripeInstance = getStripeInstance();

    if (order.paymentIntentId) {
      const existingIntent = await stripeInstance.paymentIntents.retrieve(
        order.paymentIntentId,
      );

      if (existingIntent.client_secret) {
        return NextResponse.json({
          success: true,
          data: {
            clientSecret: existingIntent.client_secret,
            orderId: order.orderId,
            amount: order.totalAmount,
            currency: "INR",
          },
        });
      }
    }

    try {
      const paymentIntent = await stripeInstance.paymentIntents.create(
        {
          amount: Math.round(order.totalAmount * 100),
          currency: "inr",
          automatic_payment_methods: { enabled: true },
          metadata: {
            orderId: order.orderId,
            userId: session.user.id,
          },
          description: `QwikBite order ${order.orderId}`,
        },
        {
          idempotencyKey: `qwikbite-payment-${idempotencyKey}`,
        },
      );

      order.paymentIntentId = paymentIntent.id;
      await order.save();

      return NextResponse.json({
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          orderId: order.orderId,
          amount: order.totalAmount,
          currency: "INR",
        },
      });
    } catch (paymentError) {
      if (order.status === "pending") {
        order.status = "cancelled";
        order.isCancelled = true;
        order.statusHistory.push({
          status: "cancelled",
          timestamp: new Date(),
          note: "Payment initialization failed",
        });
        await order.save();

        // The slot service is intentionally reached through the same order
        // lifecycle path rather than trusting client-side capacity state.
        if (order.pickupDate && order.timeSlot && order.loadValue) {
          const { syncTimeSlotUsage } = await import("@/lib/slot-utils");
          await syncTimeSlotUsage(order.pickupDate);
        }
      }

      throw paymentError;
    }
  } catch (error) {
    if (error instanceof OrderServiceError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }

    logger.error("Payment intent creation failed", error);
    return NextResponse.json(
      { error: "Unable to initialize payment." },
      { status: 500 },
    );
  }
}
