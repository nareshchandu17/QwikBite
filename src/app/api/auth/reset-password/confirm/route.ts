import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { z } from "zod";

const resetConfirmSchema = z.object({
  token: z.string().trim().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z.string().min(1, "Confirm password is required")
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({ path: ['confirmPassword'], code: z.ZodIssueCode.custom, message: 'Passwords do not match' });
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/.test(data.password)) {
    ctx.addIssue({ path: ['password'], code: z.ZodIssueCode.custom, message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' });
  }
});

/**
 * POST /api/auth/reset-password/confirm
 * 
 * Confirm password reset with token and new password.
 * 
 * ✅ Returns JSON only (no HTML, no redirects)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = resetConfirmSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: issue?.message || "Invalid reset request"
        },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    // Connect to database
    await connectDB();

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetToken: tokenHash,
      resetTokenExpiry: { $gt: new Date() }
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
