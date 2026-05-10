import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";

/**
 * POST /api/auth/reset-password/confirm
 * 
 * Confirm password reset with token and new password.
 * 
 * ✅ Returns JSON only (no HTML, no redirects)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password, confirmPassword } = body;

    // Validate input
    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Token, password, and confirm password are required"
        },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Passwords do not match"
        },
        { status: 400 }
      );
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 8 characters long"
        },
        { status: 400 }
      );
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // 1. Find user with a valid, non-expired reset token
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() } // Token must be in the future
    });

    if (!user) {
      console.warn('[reset-password-confirm] ⚠️ Invalid or expired token attempted:', token);
      return NextResponse.json(
        {
          success: false,
          error: "Your reset link has expired or is invalid. Please request a new one."
        },
        { status: 400 }
      );
    }

    // 2. Update user password
    // The password will be automatically hashed by the 'pre-save' hook in the User model
    user.password = password;
    
    // 3. Clear the reset token fields
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    console.log('[reset-password-confirm] ✅ Password reset successful for:', {
      id: user._id.toString(),
      email: user.email,
    });

    return NextResponse.json(
      {
        success: true,
        error: null,
        message: "Password reset successfully"
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[reset-password-confirm] ❌ Password reset error:', error);
    return NextResponse.json(
      {
        success: false,
        error: "Server error. Try again later."
      },
      { status: 500 }
    );
  }
}
