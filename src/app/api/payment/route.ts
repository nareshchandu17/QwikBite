import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Payment from "@/lib/models/Payment";

const STAFF_ROLES = new Set(["admin", "canteen_staff", "staff"]);

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const transactionId = req.nextUrl.searchParams.get("transactionId");
  const orderId = req.nextUrl.searchParams.get("orderId");
  if (!transactionId && !orderId) return NextResponse.json({ error: "transactionId or orderId is required" }, { status: 400 });

  const payment = await Payment.findOne(transactionId ? { transactionId } : { orderId }).lean();
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  const role = String(session.user.role || "").toLowerCase();
  const owner = String((payment as any).userId || "") === String(session.user.id) || String((payment as any).customerUserId || "") === String(session.user.id);
  if (!owner && !STAFF_ROLES.has(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({ success: true, payment });
}

export async function POST() {
  return NextResponse.json({ error: "Direct payment-record creation is disabled. Use /api/payments/create-payment-intent.", code: "PAYMENT_FLOW_DEPRECATED" }, { status: 410 });
}

export async function PUT() {
  return NextResponse.json({ error: "Direct payment status updates are disabled. Use server-side Stripe verification.", code: "PAYMENT_FLOW_DEPRECATED" }, { status: 410 });
}