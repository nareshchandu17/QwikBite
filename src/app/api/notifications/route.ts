import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { Notification } from "@/models/notification.model";
import { getAuthenticatedUser } from "@/lib/auth-helper";
import mongoose from "mongoose";
import { pusherServer, getUserChannel } from "@/lib/pusher";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(user.id)) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    await connectToDatabase();
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 20)));
    const filter = { user: new mongoose.Types.ObjectId(user.id) };
    const [rows, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, isRead: false }),
    ]);
    const data = rows.map((n: any) => ({
      id: String(n._id), _id: String(n._id), userId: String(n.user),
      title: n.title, message: n.message, type: n.type === "order_update" ? "order" : n.type === "promotion" ? "offer" : n.type === "admin" ? "feedback" : n.type,
      priority: n.priority, icon: n.icon || "🔔", isRead: Boolean(n.isRead),
      createdAt: n.createdAt, timestamp: n.createdAt, ctaLink: n.deepLink, data: n.metadata,
    }));
    return NextResponse.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit), unreadCount } });
  } catch (error) {
    logger.error("[Notifications GET] Failed", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Clients cannot forge notifications. They are created by trusted server workflows.
  return NextResponse.json({ error: "Notifications can only be created by trusted server workflows" }, { status: 405 });
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(user.id)) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    await connectToDatabase();
    const url = new URL(req.url);
    const notificationId = url.searchParams.get("id");
    const body = await req.json().catch(() => ({}));
    if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) return NextResponse.json({ error: "Valid notification ID required" }, { status: 400 });
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: new mongoose.Types.ObjectId(user.id) },
      { $set: { isRead: Boolean(body.isRead ?? body.read) } }, { new: true },
    );
    if (!notification) return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    const unreadCount = await Notification.countDocuments({ user: new mongoose.Types.ObjectId(user.id), isRead: false });
    try {
      await pusherServer.trigger(getUserChannel(user.id), "notification_updated", { notificationId, isRead: notification.isRead, unreadCount });
    } catch {
      // Persistence is authoritative; clients reconcile against MongoDB on reconnect.
    }
    return NextResponse.json({ data: notification, unreadCount });
  } catch (error) {
    logger.error("[Notifications PATCH] Failed", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(user.id)) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    await connectToDatabase();
    const url = new URL(req.url);
    const notificationId = url.searchParams.get("id");
    if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) return NextResponse.json({ error: "Valid notification ID required" }, { status: 400 });
    const deleted = await Notification.findOneAndDelete({ _id: notificationId, user: new mongoose.Types.ObjectId(user.id) });
    if (!deleted) return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    const unreadCount = await Notification.countDocuments({ user: new mongoose.Types.ObjectId(user.id), isRead: false });
    try {
      await pusherServer.trigger(getUserChannel(user.id), "notification_deleted", { notificationId, unreadCount });
    } catch {
      // The delete is durable; clients reconcile history on reconnect.
    }
    return NextResponse.json({ success: true, unreadCount });
  } catch (error) {
    logger.error("[Notifications DELETE] Failed", error);
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
  }
}
