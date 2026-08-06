import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { syncTimeSlotUsage, aggregateTimeSlots } from "@/lib/slot-utils";

export async function POST(req: NextRequest) {
  try {
    logger.info("[Manual Sync] Starting manual time slot sync...");

    // Force sync
    const syncResult = await syncTimeSlotUsage();
    logger.info("[Manual Sync] Sync result:", syncResult);

    // Get updated slots
    const slots = await aggregateTimeSlots();

    return NextResponse.json({
      success: true,
      message: "Time slots synced successfully",
      syncResult,
      slots,
    });
  } catch (error) {
    logger.error("[Manual Sync Error]", error);
    return NextResponse.json(
      {
        error: "Failed to sync time slots",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
