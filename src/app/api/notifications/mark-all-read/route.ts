import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helper";
import connectToDatabase from "@/lib/db";
import { Notification } from "@/models/notification.model";
import mongoose from "mongoose";
import { pusherServer, getUserChannel } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(user.id)) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    await connectToDatabase();
    await Notification.updateMany({ user: new mongoose.Types.ObjectId(user.id), isRead: false }, { $set: { isRead: true } });
    try {
      await pusherServer.trigger(getUserChannel(user.id), "notifications_all_read", { unreadCount: 0, timestamp: new Date().toISOString() });
    } catch {
      // MongoDB remains the source of truth if live delivery is unavailable.
    }
    return NextResponse.json({ success: true, unreadCount: 0 });
  } catch {
    return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 });
  }
}
