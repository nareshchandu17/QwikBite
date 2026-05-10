import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";

export async function POST(req: Request) {
  try {
    const { email, name, role, loginTime } = await req.json();
    
    // Validate required fields
    if (!email || !name || !role || !loginTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Connect to database
    await connectDB();

    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (user) {
      // Update existing user's last login time
      // Note: We don't update name or role to preserve user's original data
      // This is just a login record, not a profile update
    } else {
      // Create new user
      user = new User({
        email,
        name,
        role,
        regNo: `REG-${Date.now()}` // Generate a temporary regNo
      });
      await user.save();
    }

    return NextResponse.json({ 
      success: true, 
      message: "Login record saved",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err: unknown) {
    console.error("User login save error:", err);
    return NextResponse.json({ 
      error: "Server error", 
      details: err.message || "Unknown error occurred" 
    }, { status: 500 });
  }
}
