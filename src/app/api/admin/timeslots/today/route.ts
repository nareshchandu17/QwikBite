import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  checkRateLimit,
  getRateLimitIdentifier,
  RateLimitPresets,
} from "@/lib/security/rateLimiter";
import { aggregateTimeSlots } from "@/lib/slot-utils";
import { connectDB } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";

const STAFF_ROLES = new Set(["admin", "canteen_staff", "staff"]);

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = String(session?.user?.role || "").toLowerCase();

    if (!session?.user?.id || !STAFF_ROLES.has(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const limit = await checkRateLimit(
      getRateLimitIdentifier(req),
      RateLimitPresets.LENIENT.limit,
      RateLimitPresets.LENIENT.windowMs,
    );
    if (!limit.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    await connectDB();
    return NextResponse.json(await aggregateTimeSlots());
  } catch (error) {
    logger.error("[Timeslots GET] Error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = String(session?.user?.role || "").toLowerCase();

    if (!session?.user?.id || !STAFF_ROLES.has(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const limit = await checkRateLimit(
      getRateLimitIdentifier(req),
      RateLimitPresets.STANDARD.limit,
      RateLimitPresets.STANDARD.windowMs,
    );
    if (!limit.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    if (!Array.isArray(body.slots)) {
      return NextResponse.json(
        { error: "Invalid input: slots must be an array" },
        { status: 400 },
      );
    }

    await connectDB();

    const { TimeSlot } = await import("@/models/slot.model");
    const { parseSlotToDates } = await import("@/lib/slot-utils");
    const dateStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
    }).format(new Date());

    for (const slot of body.slots) {
      const timeSlot = String(slot?.timeSlot || "");
      const capacity = Number(slot?.capacity);

      if (!timeSlot || !Number.isFinite(capacity) || capacity < 1 || capacity > 10000) {
        return NextResponse.json(
          { error: "Invalid slot capacity data" },
          { status: 400 },
        );
      }

      const { start } = parseSlotToDates(timeSlot, dateStr);
      await TimeSlot.findOneAndUpdate(
        { dateOnly: dateStr, startTime: start },
        { $set: { maxLoad: Math.floor(capacity), isActive: true } },
        { upsert: true, new: true },
      );
    }

    try {
      await pusherServer.trigger("admin", "slot-update", {
        action: "capacity_updated",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.warn("[Timeslots POST] Pusher update failed", error);
    }

    return NextResponse.json({
      success: true,
      message: "Slots updated successfully",
    });
  } catch (error) {
    logger.error("[Timeslots POST] Error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
