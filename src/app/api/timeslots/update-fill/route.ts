import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(request: NextRequest) {
  try {
    logger.info("[Timeslots API] Updating timeslot fill count...");

    const { time, increment = 1 } = await request.json();

    if (!time) {
      logger.info("[Timeslots API] Error: time parameter is required");
      return NextResponse.json(
        { error: "Time parameter is required" },
        { status: 400 },
      );
    }

    logger.info("[Timeslots API] Looking for timeslot:", time);
    logger.info("[Timeslots API] Increment by:", increment);

    // Connect to database
    const client = await connectDB();
    const db = client.db();

    // Find and update the timeslot
    const result = await db.collection("timeslots").updateOne(
      { time: time },
      {
        $inc: { fill: increment },
        $set: { updatedAt: new Date() },
      },
    );

    logger.info("[Timeslots API] Update result:", result);

    if (result.matchedCount === 0) {
      logger.info("[Timeslots API] No timeslot found with time:", time);
      return NextResponse.json(
        { error: "Timeslot not found" },
        { status: 404 },
      );
    }

    if (result.modifiedCount === 0) {
      logger.info("[Timeslots API] Timeslot found but not modified");
      return NextResponse.json(
        { error: "Timeslot not modified" },
        { status: 400 },
      );
    }

    // Get the updated timeslot to return the new fill count
    const updatedTimeslot = await db
      .collection("timeslots")
      .findOne({ time: time });

    logger.info("[Timeslots API] ✅ Timeslot updated successfully:", {
      time,
      newFill: updatedTimeslot?.fill,
      previousFill: (updatedTimeslot?.fill || 0) - increment,
    });

    return NextResponse.json({
      success: true,
      message: "Timeslot fill count updated successfully",
      time: time,
      fill: updatedTimeslot?.fill,
      increment: increment,
    });
  } catch (error) {
    logger.error("[Timeslots API] ❌ Error updating timeslot fill:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
