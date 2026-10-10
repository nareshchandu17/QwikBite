import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helper";
import connectToDatabase from "@/lib/db";
import { Notification } from "@/models/notification.model";
import { pusherServer, getUserChannel } from "@/lib/pusher";
import mongoose from "mongoose";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(user.id) || !mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 });
    }
    await connectToDatabase();
    const deleted = await Notification.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(params.id),
      user: new mongoose.Types.ObjectId(user.id),
    });
    if (!deleted) return NextResponse.json({ error: "Notification not found" }, { status: 404 });

    const unreadCount = await Notification.countDocuments({ user: new mongoose.Types.ObjectId(user.id), isRead: false });
    try {
      await pusherServer.trigger(getUserChannel(user.id), "notification_deleted", { notificationId: params.id, unreadCount });
    } catch {
      // MongoDB is authoritative; other active clients reconcile against history on reconnect.
    }
    return NextResponse.json({ success: true, unreadCount });
  } catch {
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
  }
}
