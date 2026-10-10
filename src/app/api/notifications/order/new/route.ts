import { NextResponse } from "next/server";

// New-order admin notifications are created by the validated order creation
// workflow. This legacy endpoint accepted caller-supplied order details.
export async function POST() {
  return NextResponse.json(
    { error: "Disabled. New-order notifications are emitted by the validated order creation workflow." },
    { status: 410 },
  );
}
