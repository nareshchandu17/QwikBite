import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/db";
import { Order, OrderStatus, PaymentStatus } from "@/models/order.model";
import { SlotService } from "@/lib/services/slotService";
import { pusherServer } from "@/lib/pusher";
import { NotificationService } from "@/lib/services/notification.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let stripe: Stripe | null = null;

function getStripe() {
  if (!stripe) {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) throw new Error("STRIPE_SECRET_KEY is not configured");
    stripe = new Stripe(secret);
  }
  return stripe;
}

async function publishOrder(order: any, title: string, message: string) {
  const orderId = order.orderId || String(order._id);

  try {
    await pusherServer.trigger(
      "order-" + orderId.replace(/:/g, "-"),
      "order:update",
      {
        order: order.toObject ? order.toObject() : order,
        status: order.status,
        paymentStatus: order.paymentStatus,
        timestamp: new Date().toISOString(),
      },
    );
  } catch (error) {
    logger.warn("[Stripe webhook] Pusher publish failed", error);
  }

  try {
    await NotificationService.notifyCustomer({
      userId: String(order.user),
      title,
      message,
      type: "payment",
    });
  } catch (error) {
    logger.warn("[Stripe webhook] notification failed", error);
  }
}

async function handleSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const orderId = String(paymentIntent.metadata?.orderId || "");
  const userId = String(paymentIntent.metadata?.userId || "");

  if (!orderId || !userId) {
    throw new Error("Stripe payment intent is missing QwikBite metadata");
  }

  const order = await Order.findOne({ orderId, user: userId });
  if (!order) {
    logger.error("[Stripe webhook] Order not found", { orderId });
    return;
  }

  const validAmount =
    paymentIntent.currency.toLowerCase() === "inr" &&
    paymentIntent.amount === Math.round(order.totalAmount * 100);

  if (!validAmount) {
    logger.error("[Stripe webhook] Payment amount/currency mismatch", {
      orderId,
      paymentIntentId: paymentIntent.id,
    });
    return;
  }

  if (order.paymentStatus === PaymentStatus.PAID) return;

  if (
    order.status === OrderStatus.CANCELLED ||
    (order.reservationExpiresAt &&
      order.reservationExpiresAt.getTime() < Date.now())
  ) {
    const refund = await getStripe().refunds.create({
      payment_intent: paymentIntent.id,
      reason: "requested_by_customer",
      metadata: {
        orderId,
        reason: "reservation_expired",
      },
    });

    order.paymentStatus = PaymentStatus.REFUNDED;
    order.statusHistory.push({
      status: OrderStatus.CANCELLED,
      timestamp: new Date(),
      note: "Stripe payment received after reservation expiry; refund " + refund.id,
    });
    await order.save();

    await publishOrder(
      order,
      "Payment refunded",
      "Your pickup reservation expired, so your Stripe payment was refunded.",
    );
    return;
  }

  order.paymentIntentId = paymentIntent.id;
  order.paymentStatus = PaymentStatus.PAID;
  order.reservationExpiresAt = undefined;

  if (order.status === OrderStatus.PENDING) {
    order.status = OrderStatus.CONFIRMED;
    order.statusHistory.push({
      status: OrderStatus.CONFIRMED,
      timestamp: new Date(),
      note: "Payment confirmed by Stripe webhook",
    });
  }

  await order.save();

  await publishOrder(
    order,
    "Payment confirmed",
    "Payment confirmed for order " + order.orderId + ".",
  );
}

async function handleFailed(paymentIntent: Stripe.PaymentIntent, reason: string) {
  const orderId = String(paymentIntent.metadata?.orderId || "");
  const userId = String(paymentIntent.metadata?.userId || "");

  if (!orderId || !userId) return;

  const order = await Order.findOne({ orderId, user: userId });
  if (!order) return;

  if (order.paymentStatus === PaymentStatus.PAID) return;

  order.paymentIntentId = paymentIntent.id;
  order.paymentStatus = PaymentStatus.FAILED;

  if (
    order.status === OrderStatus.PENDING &&
    order.paymentMethod === "stripe"
  ) {
    order.status = OrderStatus.CANCELLED;
    order.isCancelled = true;
    order.reservationExpiresAt = undefined;
    order.statusHistory.push({
      status: OrderStatus.CANCELLED,
      timestamp: new Date(),
      note: "Online payment failed: " + reason,
    });
  }

  await order.save();

  if (
    order.pickupDate &&
    order.timeSlot &&
    order.loadValue &&
    order.status === OrderStatus.CANCELLED
  ) {
    await SlotService.releaseSlot(
      order.timeSlot,
      order.pickupDate,
      order.loadValue,
    );
  }

  await publishOrder(
    order,
    "Payment failed",
    "Payment failed for order " + order.orderId + ". Please start checkout again.",
  );
}

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return NextResponse.json(
        { error: "STRIPE_WEBHOOK_SECRET is not configured" },
        { status: 503 },
      );
    }

    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json(
        { error: "Missing Stripe signature" },
        { status: 400 },
      );
    }

    const payload = await request.text();
    const event = getStripe().webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );

    await connectDB();

    switch (event.type) {
      case "payment_intent.succeeded":
        await handleSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.payment_failed":
        await handleFailed(
          event.data.object as Stripe.PaymentIntent,
          "Stripe reported payment failure",
        );
        break;
      case "payment_intent.canceled":
        await handleFailed(
          event.data.object as Stripe.PaymentIntent,
          "Payment intent was cancelled",
        );
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("[Stripe webhook] Error", error);
    return NextResponse.json(
      { error: "Webhook verification or processing failed" },
      { status: 400 },
    );
  }
}
