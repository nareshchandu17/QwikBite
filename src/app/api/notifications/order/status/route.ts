import { NextResponse } from "next/server";

// Order-status notifications are emitted by the authenticated order transition
// handlers after a valid server-side state change. This legacy endpoint accepted
// arbitrary userId/status values and could be abused to spoof customer alerts.
export async function POST() {
  return NextResponse.json(
    { error: "Disabled. Order-status notifications are emitted by the validated order transition workflow." },
    { status: 410 },
  );
}
