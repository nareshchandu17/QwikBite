import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { Notification } from "@/lib/models";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";

import { getAuthenticatedUser } from "@/lib/auth-helper";

// GET /api/notifications - Get user's notifications
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user?.id) {
      logger.info("[Notifications GET] Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    await connectToDatabase();
    logger.info("[Notifications GET] Fetching for user:", userId);

    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") || "1");
    const limit = Math.min(Number(url.searchParams.get("limit") || "20"), 200);
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Notification.countDocuments({ userId });

    logger.info(
      "[Notifications GET] ✅ Found",
      notifications.length,
      "notifications",
    );
    return NextResponse.json(
      {
        data: notifications,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    logger.error("[Notifications GET] ❌ Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}

// POST /api/notifications - Create a new notification
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    await connectToDatabase();

    const body = await req.json();
    const { title, message, type, read = false } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "title and message required" },
        { status: 400 },
      );
    }

    const notification = await Notification.create({
      userId,
      title,
      message,
      type: type || "info",
      read,
      createdAt: new Date(),
    });

    logger.info(
      "[Notifications POST] ✅ Created notification for user:",
      userId,
    );
    return NextResponse.json({ data: notification }, { status: 201 });
  } catch (error: unknown) {
    logger.error("[Notifications POST] ❌ Error:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 },
    );
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    await connectToDatabase();

    const url = new URL(req.url);
    const notificationId = url.searchParams.get("id");
    const { read } = await req.json();

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID required" },
        { status: 400 },
      );
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read },
      { new: true },
    );

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 },
      );
    }

    logger.info(
      "[Notifications PATCH] ✅ Updated notification:",
      notificationId,
    );
    return NextResponse.json({ data: notification }, { status: 200 });
  } catch (error: unknown) {
    logger.error("[Notifications PATCH] ❌ Error:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 },
    );
  }
}
// DELETE /api/notifications - Delete notification
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectToDatabase();
    
    const url = new URL(req.url);
    // Parse ID from either search params or path
    let notificationId = url.searchParams.get("id");
    const pathParts = url.pathname.split('/');
    if (!notificationId && pathParts.length > 0 && pathParts[pathParts.length - 1] !== 'notifications') {
      notificationId = pathParts[pathParts.length - 1];
    }
    
    if (!notificationId) return NextResponse.json({ error: "Notification ID required" }, { status: 400 });
    
    await Notification.findOneAndDelete({ _id: notificationId, userId: user.id });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
