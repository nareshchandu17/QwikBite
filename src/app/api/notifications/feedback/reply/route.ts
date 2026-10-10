import { NextResponse } from "next/server";

// This legacy endpoint accepted arbitrary feedbackId/userId values and could
// send notifications without authenticating the caller or checking the feedback.
// The authenticated feedback reply workflow now persists and dispatches the event.
export async function POST() {
  return NextResponse.json(
    { error: "Disabled. Feedback notifications are sent by the authenticated feedback reply workflow." },
    { status: 410 },
  );
}
