import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 400 });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    
    return NextResponse.json({ 
      success: true, 
      decoded,
      message: "Token is valid" 
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json({ 
      error: "Server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}