import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";
import { z } from "zod";

const resetPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email format")
});

/**
 * POST /api/auth/reset-password
 * 
 * Request password reset for a user.
 * Generates a reset token and sends it via email (or returns it for testing).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email format"
        },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Connect to database (connectDB uses connection pooling and caching)
    await connectDB();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // For security, don't reveal if email exists or not
    // Always return success message
    if (!user) {
      // Still return success to prevent email enumeration
      return NextResponse.json(
        {
          success: true,
          message: "If an account with that email exists, a password reset link has been sent."
        },
        { status: 200 }
      );
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);

    user.resetToken = resetTokenHash;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // 4. Send reset email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
    const resetLink = `${baseUrl}/reset-password/confirm?token=${resetToken}`;
    
    try {
      await sendEmail({
        to: user.email,
        subject: 'Reset your qwikBite Password 🔐',
        text: `You requested a password reset. Click this link to reset it: ${resetLink}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #f96124; margin: 0; font-size: 28px;">qwikBite</h1>
            </div>
            <p style="font-size: 16px; color: #333;">Hi there,</p>
            <p style="font-size: 16px; color: #333; line-height: 1.5;">We received a request to reset your password. Click the button below to set a new one and get back to your food!</p>
            <div style="text-align: center; margin: 35px 0;">
              <a href="${resetLink}" style="background-color: #f96124; color: white; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(249, 97, 36, 0.2);">Reset My Password</a>
            </div>
            <p style="color: #666; font-size: 14px; line-height: 1.5;">This link will expire in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">Sent with ❤️ from the qwikBite Team</p>
          </div>
        `
      });
      console.log(`[Password Reset] ✅ Email sent to ${user.email}`);
    } catch (emailError) {
      console.error('[Password Reset] ❌ Email send failed:', emailError);
      // In production, you might want to return an error, but for security, 
      // we usually return success even if email fails to prevent account enumeration.
    }

    return NextResponse.json(
      {
        success: true,
        message: "If an account with that email exists, a password reset link has been sent."
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('[reset-password] ❌ Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error. Please try again later."
      },
      { status: 500 }
    );
  }
}
