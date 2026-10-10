import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth-helper";
import { Order } from "@/models/order.model";
import { pusherServer } from "@/lib/pusher";

const STAFF_ROLES = new Set(["admin", "canteen_staff", "staff"]);

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const form = await req.formData();
    const socketId = String(form.get("socket_id") || "");
    const channelName = String(form.get("channel_name") || "");
    if (!/^\\d+\\.\\d+$/.test(socketId) || !channelName) {
      return NextResponse.json({ error: "Invalid Pusher authorization request" }, { status: 400 });
    }

    const role = String(user.role || "").toLowerCase();
    let allowed = false;

    if (channelName.startsWith("private-user-")) {
      allowed = channelName === `private-user-${user.id}`;
    } else if (channelName === "private-admin") {
      allowed = STAFF_ROLES.has(role);
    } else if (channelName.startsWith("private-order-")) {
      const publicId = channelName.slice("private-order-".length);
      if (!publicId || publicId.length > 100) return NextResponse.json({ error: "Invalid order channel" }, { status: 400 });
      await connectDB();
      const order = await Order.findOne({
        $or: [
          { orderId: publicId },
          ...(mongoose.Types.ObjectId.isValid(publicId) ? [{ _id: publicId }] : []),
        ],
      }).select("user").lean();
      allowed = Boolean(order && (String(order.user) === String(user.id) || STAFF_ROLES.has(role)));
    }

    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json(pusherServer.authorizeChannel(socketId, channelName));
  } catch {
    return NextResponse.json({ error: "Pusher authorization failed" }, { status: 500 });
  }
}
