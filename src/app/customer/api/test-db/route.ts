import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";

export async function GET() {
  try {
    // Connect to database
    await connectDB();
    
    // Count users in the database
    const userCount = await User.countDocuments();
    
    // Get a sample user (if exists)
    const sampleUser = await User.findOne({}, { password: 0 }); // Exclude password
    
    return NextResponse.json({ 
      success: true,
      message: "Database connection successful",
      userCount,
      sampleUser
    });
  } catch (err: unknown) {
    console.error("Database test error:", err);
    return NextResponse.json({ 
      success: false,
      error: "Database connection failed", 
      details: err.message || "Unknown error occurred" 
    }, { status: 500 });
  }
}
