import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NotificationService } from "@/lib/services/notification.service";
import { checkRateLimit, getRateLimitIdentifier, RateLimitPresets } from "@/lib/security/rateLimiter";
import { sanitizeString } from "@/lib/security/sanitizer";

const STAFF_ROLES = new Set(["admin", "canteen_staff", "staff"]);

const ACTIONS: Record<string, { title: string; icon: string }> = {
  add: { title: "✨ New Item Added", icon: "✨" },
  update: { title: "📝 Menu Item Updated", icon: "📝" },
  remove: { title: "🗑️ Item Removed", icon: "🗑️" },
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = String(session?.user?.role || "").toLowerCase();
    if (!session?.user?.id || !STAFF_ROLES.has(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rate = await checkRateLimit(
      getRateLimitIdentifier(req),
      RateLimitPresets.STANDARD.limit,
      RateLimitPresets.STANDARD.windowMs,
    );
    if (!rate.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "").toLowerCase();
    const itemName = sanitizeString(String(body.itemName || "")).trim().slice(0, 100);
    const category = sanitizeString(String(body.category || "")).trim().slice(0, 80);
    const message = sanitizeString(String(body.message || "")).trim().slice(0, 300);
    const actionInfo = ACTIONS[action];

    if (!actionInfo || !itemName) {
      return NextResponse.json({ error: "A valid action and itemName are required" }, { status: 400 });
    }

    const sent = await NotificationService.notifyAllCustomers({
      title: actionInfo.title,
      message: message || `${itemName}${category ? ` (${category})` : ""} has been ${action}d from our menu`,
      type: "menu",
      priority: "normal",
      icon: actionInfo.icon,
      data: { itemName, category, action, timestamp: new Date().toISOString() },
      ctaLink: "/customer/menu",
    });

    if (!sent) return NextResponse.json({ error: "Menu notification could not be persisted" }, { status: 500 });
    return NextResponse.json({ success: true, message: "Menu update saved to customer inboxes and dispatched" });
  } catch (error) {
    logger.error("[Menu Notification API] Failed", error);
    return NextResponse.json({ error: "Failed to send menu notification" }, { status: 500 });
  }
}
