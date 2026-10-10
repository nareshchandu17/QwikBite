import { NextResponse } from "next/server";

// New-feedback notifications are emitted by the validated feedback workflow.
// This legacy endpoint accepted caller-supplied feedback text and could spam admins.
export async function POST() {
  return NextResponse.json(
    { error: "Disabled. Feedback notifications are emitted by the validated feedback workflow." },
    { status: 410 },
  );
}
