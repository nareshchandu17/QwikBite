import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { User } from "@/models/user.model";
import { connectDB } from "@/lib/db";
import NotificationService, { type NotificationPayload } from "@/lib/services/notification.service";
import { checkRateLimit, getRateLimitIdentifier, RateLimitPresets } from "@/lib/security/rateLimiter";
import { sanitizeObject, sanitizeString } from "@/lib/security/sanitizer";

const ALLOWED_TYPES = new Set(["order", "payment", "menu", "offer", "feedback", "system", "alert"]);
const ALLOWED_PRIORITIES = new Set(["low", "normal", "high"]);
const STAFF_ROLES = new Set(["admin", "canteen_staff", "staff"]);

async function authorize(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = String(session?.user?.role || "").toLowerCase();
  if (!session?.user?.id || !STAFF_ROLES.has(role)) {
    return { error: NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 }) };
  }
  const limit = await checkRateLimit(
    getRateLimitIdentifier(req),
    RateLimitPresets.STANDARD.limit,
    RateLimitPresets.STANDARD.windowMs,
  );
  if (!limit.allowed) {
    return { error: NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 }) };
  }
  return { session };
}

function parsePayload(body: any): Omit<NotificationPayload, "userId"> | null {
  const sanitized = sanitizeObject(body || {});
  const title = sanitizeString(String(sanitized.title || "")).trim();
  const message = sanitizeString(String(sanitized.message || "")).trim();
  const type = String(sanitized.type || "system").toLowerCase();
  const priority = String(sanitized.priority || "normal").toLowerCase();
  if (!title || !message || title.length > 100 || message.length > 300) return null;
  if (!ALLOWED_TYPES.has(type) || !ALLOWED_PRIORITIES.has(priority)) return null;
  return {
    title,
    message,
    type: type as NotificationPayload["type"],
    priority: priority as NotificationPayload["priority"],
    icon: sanitized.icon ? sanitizeString(String(sanitized.icon)).slice(0, 40) : undefined,
    data: sanitized.data,
    ctaLink: sanitized.ctaLink ? sanitizeString(String(sanitized.ctaLink)).slice(0, 300) : undefined,
  };
}

// Send a durable notification to one customer.
export async function POST(req: NextRequest) {
  try {
    const auth = await authorize(req);
    if ("error" in auth) return auth.error;
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const userId = sanitizeString(String(body.userId || ""));
    const payload = parsePayload(body);
    if (!userId || !payload) {
      return NextResponse.json({ error: "A valid userId, title, message, type and priority are required" }, { status: 400 });
    }

    const customer = await User.findById(userId).select("_id role").lean();
    if (!customer || String(customer.role || "").toLowerCase() !== "customer") {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const notification = await NotificationService.notifyCustomer({ ...payload, userId });
    if (!notification) {
      return NextResponse.json({ error: "Notification could not be persisted" }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: notification, message: "Notification saved and dispatched" }, { status: 201 });
  } catch (error) {
    logger.error("[Admin Notifications] Failed to send customer notification", error);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}

// Broadcast to all customers. Each student gets a private, persisted notification record.
export async function PUT(req: NextRequest) {
  try {
    const auth = await authorize(req);
    if ("error" in auth) return auth.error;
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const payload = parsePayload(body);
    if (!payload) {
      return NextResponse.json({ error: "A valid title, message, type and priority are required" }, { status: 400 });
    }

    const sent = await NotificationService.notifyAllCustomers(payload);
    if (!sent) {
      return NextResponse.json({ error: "Broadcast could not be persisted" }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: "Broadcast notifications saved to customer inboxes and dispatched in real time" }, { status: 201 });
  } catch (error) {
    logger.error("[Admin Notifications] Failed to broadcast to customers", error);
    return NextResponse.json({ error: "Failed to broadcast notification" }, { status: 500 });
  }
}
