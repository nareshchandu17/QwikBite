export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { getAuthCookie, verifyToken } from "@/lib/auth";
import { hash } from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
    // Get token from cookie
    const token = getAuthCookie(req);
    
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // Connect to database
    await connectDB();

    // Find user by email
    const user = await User.findOne({ email: decoded.email });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return user data without password
    const { password: _, ...userData } = user.toObject();
    
    // Log the email to console as requested
    console.log("Profile request for user email:", user.email);
    
    return NextResponse.json({ 
      success: true,
      user: {
        id: userData._id,
        name: userData.name,
        email: userData.email,
        regNo: userData.regNo,
        role: userData.role
      }
    });
  } catch (err: any) {
    console.error("Profile error:", err);
    return NextResponse.json({ 
      error: "Server error", 
      details: err.message || "Unknown error occurred" 
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Get token from cookie
    const token = getAuthCookie(req);
    
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // Get request body
    const { name, email, regNo, phone, password } = await req.json();

    // Connect to database
    await connectDB();

    // Find user by email
    const user = await User.findOne({ email: decoded.email });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (regNo) user.regNo = regNo;
    if (phone) user.phone = phone;
    if (password) {
      user.password = await hash(password, 12);
    }

    // Save updated user
    await user.save();

    // Return updated user data without password
    const { password: _, ...userData } = user.toObject();
    
    return NextResponse.json({ 
      success: true,
      user: {
        id: userData._id,
        name: userData.name,
        email: userData.email,
        regNo: userData.regNo,
        phone: userData.phone,
        role: userData.role
      }
    });
  } catch (err: any) {
    console.error("Update profile error:", err);
    return NextResponse.json({ 
      error: "Failed to update profile", 
      details: err.message || "Unknown error occurred" 
    }, { status: 500 });
  }
}
