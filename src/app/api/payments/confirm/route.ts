import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { Order, OrderStatus, PaymentStatus } from "@/models/order.model";
import { pusherServer } from "@/lib/pusher";
import { NotificationService } from "@/lib/services/notification.service";

let stripe: Stripe | null = null;

function getStripe() {
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

    await connectDB();

    const body = await request.json().catch(() => ({}));
    const { orderId, paymentIntentId } = body;

    if (!orderId || !paymentIntentId) {
      return NextResponse.json(
        { error: "orderId and paymentIntentId are required." },
        { status: 400 },
      );
    }

    const order = await Order.findOne({ orderId });
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (String(order.user) !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (order.paymentIntentId !== paymentIntentId) {
      return NextResponse.json({ error: "Payment mismatch." }, { status: 409 });
    }

    const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);

    const valid =
      paymentIntent.status === "succeeded" &&
      paymentIntent.currency.toLowerCase() === "inr" &&
      paymentIntent.amount === Math.round(order.totalAmount * 100) &&
      String(paymentIntent.metadata?.orderId || "") === order.orderId &&
      String(paymentIntent.metadata?.userId || "") === session.user.id;

    if (!valid) {
      return NextResponse.json(
        { error: "Payment could not be verified." },
        { status: 402 },
      );
    }

    if (order.paymentStatus !== PaymentStatus.PAID) {
      order.paymentStatus = PaymentStatus.PAID;

      if (order.status === OrderStatus.PENDING) {
        order.status = OrderStatus.CONFIRMED;
        order.statusHistory.push({
          status: OrderStatus.CONFIRMED,
          timestamp: new Date(),
          note: "Payment confirmed",
        });
      }

      order.reservationExpiresAt = undefined;
      await order.save();
    }

    try {
      await pusherServer.trigger(
        `order-${order.orderId.replace(/:/g, "-")}`,
        "order:update",
        {
          order: order.toObject(),
          status: order.status,
          paymentStatus: order.paymentStatus,
        },
      );
    } catch (error) {
      logger.warn("Payment confirmation Pusher event failed", error);
    }

    try {
      await NotificationService.notifyCustomer({
        userId: String(order.user),
        title: "Payment confirmed",
        message: `Payment confirmed for order ${order.orderId}.`,
        type: "payment",
      });
    } catch (error) {
      logger.warn("Payment confirmation notification failed", error);
    }

    return NextResponse.json(
      { success: true, data: order.toObject() },
      { status: 200 },
    );
  } catch (error) {
    logger.error("Payment confirmation failed", error);
    return NextResponse.json(
      { error: "Unable to confirm payment." },
      { status: 500 },
    );
  }
}
