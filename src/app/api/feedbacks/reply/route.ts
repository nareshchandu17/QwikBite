import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import FeedbackCollection from "@/lib/models/FeedbackCollection";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import NotificationService from "@/lib/services/notification.service";

export async function POST(req: NextRequest) {
  // Admin authentication check
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const userRole = (session.user as { role?: string }).role;
  if (!["admin", "canteen_staff"].includes(userRole as any)) {
    return NextResponse.json(
      { success: false, error: "Forbidden - Insufficient permissions" },
      { status: 403 },
    );
  }

  await connectDB();

  try {
    const { feedbackId, reply } = await req.json();

    if (!feedbackId || !reply) {
      return NextResponse.json(
        {
          success: false,
          error: "Feedback ID and reply are required",
        },
        { status: 400 },
      );
    }

    // Find the feedback using Mongoose
    const feedback = await FeedbackCollection.findOne({ feedbackId });

    if (!feedback) {
      return NextResponse.json(
        {
          success: false,
          error: "Feedback not found",
        },
        { status: 404 },
      );
    }

    // Update the feedback with the admin reply
    feedback.adminReply = reply;
    await feedback.save();

    // Use the shared notification service so the message is persisted with the
    // canonical schema and delivered only over this student's private channel.
    if (feedback.studentId) {
      const notification = await NotificationService.notifyCustomer({
        userId: feedback.studentId,
        title: "Admin replied to your feedback",
        message: `Admin has replied to your feedback: "${reply.substring(0, 100)}${reply.length > 100 ? "..." : ""}"`,
        type: "feedback",
        priority: "normal",
        ctaLink: `/customer/feedback?feedbackId=${feedback._id.toString()}`,
        data: {
          feedbackId: feedback._id.toString(),
          feedbackText: feedback.feedbackText,
          adminReply: reply,
        },
      });

      if (!notification) {
        logger.warn("Feedback reply was saved, but its notification could not be persisted", {
          feedbackId: feedback.feedbackId,
          studentId: feedback.studentId,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Reply added successfully",
    });
  } catch (error: any) {
    logger.error("Error adding reply:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
