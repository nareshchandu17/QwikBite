import logger from "@/lib/logger";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { generateClientCSRFToken } from "@/lib/security/csrf";

export async function GET() {
  try {
    const secret = process.env.CSRF_SECRET;

    if (!secret) {
      return NextResponse.json(
        {
          success: false,
          error: "CSRF protection is not configured.",
        },
        { status: process.env.NODE_ENV === "production" ? 503 : 500 },
      );
    }

    const { token, signature } = generateClientCSRFToken(secret);

    return NextResponse.json({ success: true, token, signature });
  } catch (error) {
    logger.error("[CSRF GET] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate CSRF token" },
      { status: 500 },
    );
  }
}
