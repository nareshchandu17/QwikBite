import { NextResponse } from "next/server";

// Payment-status notifications must originate from verified payment settlement
// (e.g. the signed provider webhook), never from caller-supplied status/amount.
export async function POST() {
  return NextResponse.json(
    { error: "Disabled. Payment notifications are emitted by verified payment settlement workflows." },
    { status: 410 },
  );
}
