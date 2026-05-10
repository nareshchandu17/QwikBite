import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { generateToken, setAuthCookie } from "@/lib/auth";

/**
 * POST /api/auth/signin
 * 
 * Authenticate user with email and password.
 * Returns user data with role for NextAuth to create session.
 * 
 * ✅ Returns JSON only (no HTML, no redirects)
 * ✅ Includes role in response
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Email and password are required"
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user || !user.password) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password"
        },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await user.comparePassword(password);

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password"
        },
        { status: 401 }
      );
    }

    // ✅ Success: Return user with role (normalized to lowercase) and JWT token
    const userRole = (user.role || "customer").toLowerCase();
    console.log('[signin] ✅ User authenticated:', {
      id: user._id.toString(),
      email: user.email,
      role: userRole
    });

    // Generate JWT token for API authentication
    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: userRole,
      regNo: user.regNo
    };
    
    const token = generateToken(tokenPayload);
    console.log('[signin] ✅ JWT token generated for user:', user._id.toString());

    // Create response and set auth cookie
    const response = NextResponse.json(
      {
        success: true,
        error: null,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: userRole, // ✅ IMPORTANT: Include role in lowercase
          regNo: user.regNo,
        },
        token: token, // Include token in response for client-side storage
      },
      { status: 200 }
    );

    // Set auth cookie for API authentication
    setAuthCookie(token, response);

    return response;
  } catch (error) {
    console.error('[signin] ❌ Signin error:', error);
    return NextResponse.json(
      {
        success: false,
        error: "Server error. Try again later."
      },
      { status: 500 }
    );
  }
}
