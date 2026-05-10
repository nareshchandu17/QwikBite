import { NextRequest, NextResponse } from "next/server";
import { getAuthCookie } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = getAuthCookie(req);
    
    return NextResponse.json({ 
      success: true, 
      token: token ? 'Present' : 'Missing',
      tokenValue: token,
      message: token ? "Cookie found" : "No cookie found"
    });
  } catch (error) {
    console.error("Cookie test error:", error);
    return NextResponse.json({ 
      error: "Server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}