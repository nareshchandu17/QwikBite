import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/order.model";
import { pusherServer } from "@/lib/pusher";
import mongoose from "mongoose";

const STAFF_ROLES = new Set(["admin", "canteen_staff", "staff"]);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const role = String(session?.user?.role || "").toLowerCase();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const form = await req.formData();
    const socketId = String(form.get("socket_id") || "");
    const channelName = String(form.get("channel_name") || "");
    if (!socketId || !channelName) return NextResponse.json({ error: "Missing Pusher auth fields" }, { status: 400 });

    let allowed = channelName === `private-user-${userId}`
      || (channelName === "private-admin" && STAFF_ROLES.has(role));

    if (!allowed && channelName.startsWith("private-order-")) {
      const publicId = channelName.slice("private-order-".length);
      await connectDB();
      const filter = { $or: [{ orderId: publicId }, ...(mongoose.isValidObjectId(publicId) ? [{ _id: publicId }] : [])] };
      const order = await Order.findOne(filter).select("user");
      allowed = Boolean(order && (String(order.user) === userId || STAFF_ROLES.has(role)));
    }

    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json(pusherServer.authorizeChannel(socketId, channelName));
  } catch {
    return NextResponse.json({ error: "Pusher authorization failed" }, { status: 500 });
  }
}
