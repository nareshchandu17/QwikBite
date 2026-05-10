import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";

export async function GET() {
  try {
    // Connect to database
    await connectDB();
    
    // Count users
    const userCount = await User.countDocuments();
    
    // Get all users (excluding passwords)
    const users = await User.find({}, { password: 0 });
    
    return NextResponse.json({ 
      success: true,
      userCount,
      users
    });
  } catch (error: unknown) {
    console.error("Error checking users:", error);
    return NextResponse.json({ 
      success: false,
      error: error.message || "Failed to check users"
    }, { status: 500 });
  }
}
