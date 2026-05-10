import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { authConfig } from "@/auth";

export async function POST() {
  try {
    // Get session (if exists) to ensure clean logout
    const session = await getServerSession(authConfig);

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    // 1️⃣ Clear custom auth cookies
    clearAuthCookie(response);

    // 2️⃣ Clear NextAuth cookies manually (CRITICAL)
    response.cookies.set("next-auth.session-token", "", {
      path: "/",
      maxAge: 0,
    });

    response.cookies.set("__Secure-next-auth.session-token", "", {
      path: "/",
      maxAge: 0,
      secure: true,
    });

    response.cookies.set("next-auth.callback-url", "/", {
      path: "/",
      maxAge: 0,
    });

    response.cookies.set("next-auth.csrf-token", "", {
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    );
  }
}

// Allow GET logout as well
export async function GET() {
  return POST();
}
