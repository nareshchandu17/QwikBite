import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";

export async function POST(req: Request) {
  try {
    console.log("Signup API called");
    const { name, regNo, email, password, role = 'customer' } = await req.json();
    console.log("Received data:", { name, regNo, email, role }); // Log received data (without password)
    
    // Validate required fields
    if (!name || !regNo || !email || !password) {
      console.log("Validation failed: missing fields");
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    
    // Connect to database
    console.log("Attempting to connect to DB...");
    await connectDB();
    console.log("DB connection successful");

    // Check if user already exists
    console.log("Checking for existing user with email:", email);
    const existing = await User.findOne({ email });
    if (existing) {
      console.log("User already exists");
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Hash password
    console.log("Hashing password...");
    const hashed = await bcrypt.hash(password, 10);
    console.log("Password hashed successfully");
    
    // Create new user with role
    console.log("Creating new user with role:", role);
    const user = new User({ name, regNo, email, password: hashed, role });
    await user.save();
    console.log("User created successfully");

    return NextResponse.json({ success: true, message: "User created successfully. Please sign in to continue." });
  } catch (err: unknown) {
    console.error("Signup error:", err);
    console.error("Error stack:", err.stack);
    return NextResponse.json({ 
      error: "Server error", 
      details: err.message || "Unknown error occurred",
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}
