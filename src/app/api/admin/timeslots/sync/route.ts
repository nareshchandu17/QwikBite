import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { syncTimeSlotUsage, aggregateTimeSlots } from "@/lib/slot-utils";

const STAFF_ROLES = new Set(["admin", "canteen_staff", "staff"]);

export async function POST(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = String(session?.user?.role || "").toLowerCase();

    if (!session?.user?.id || !STAFF_ROLES.has(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await syncTimeSlotUsage();
    const slots = await aggregateTimeSlots();

    return NextResponse.json({
      success: true,
      message: "Time slots synced successfully",
      slots,
    });
  } catch (error) {
    logger.error("[Manual Sync Error]", error);
    return NextResponse.json(
      { error: "Failed to sync time slots" },
      { status: 500 },
    );
  }
}
