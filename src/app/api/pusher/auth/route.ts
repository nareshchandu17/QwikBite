import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { pusherServer } from "@/lib/pusher";

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

    const userChannel = `private-user-${userId}`;
    const adminChannel = "private-admin";
    const allowed = channelName === userChannel
      || (channelName === adminChannel && ["admin", "canteen_staff", "staff"].includes(role));

    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    return NextResponse.json(pusherServer.authorizeChannel(socketId, channelName));
  } catch {
    return NextResponse.json({ error: "Pusher authorization failed" }, { status: 500 });
  }
}
