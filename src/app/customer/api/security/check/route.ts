import { NextResponse } from "next/server";
import { performSecurityCheck } from "@/lib/security/securityCheck";

export async function GET() {
  try {
    const securityReport = await performSecurityCheck();
    
    return NextResponse.json({
      success: true,
      report: securityReport
    });
  } catch (error) {
    console.error("Security check error:", error);
    return NextResponse.json({ 
      success: false,
      error: "Failed to perform security check"
    }, { status: 500 });
  }
}