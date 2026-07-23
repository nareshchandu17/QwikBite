import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import FeedbackCollection, { IFeedbackCollection } from '@/lib/models/FeedbackCollection';
import { feedbackIntelligenceService } from '@/lib/ai/feedback-intelligence.service';
import { verifyToken, parseCookies } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkRateLimit, getRateLimitIdentifier, RateLimitPresets } from '@/lib/security/rateLimiter';
import { sanitizeString, sanitizeObject } from '@/lib/security/sanitizer';

export const dynamic = 'force-dynamic';

// Helper to get user ID from auth token
const getUserId = (req: NextRequest): string | null => {
  const cookieHeader = req.headers.get('cookie');
  const cookies = parseCookies(cookieHeader);
  const token = cookies['auth_token'];
  if (!token) return null;

  const payload = verifyToken(token);
  return payload?.id || null;
};

// GET /api/feedbacks - Get user's feedback or all feedback (for admin)
export async function GET(req: NextRequest) {
  await connectDB();

  try {
    const userId = getUserId(req);
    const url = new URL(req.url);
    const showAll = url.searchParams.get('all') === 'true';

    // Admin authentication check for viewing all feedbacks
    if (showAll) {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const userRole = (session.user as { role?: string }).role;
      if (!['admin', 'canteen_staff'].includes(userRole as any)) {
        return NextResponse.json({ success: false, error: 'Forbidden - Insufficient permissions' }, { status: 403 });
      }

      // Rate limiting for admin requests
      const identifier = getRateLimitIdentifier(req as Request);
      const rateLimitResult = checkRateLimit(identifier, RateLimitPresets.LENIENT.limit, RateLimitPresets.LENIENT.windowMs);
      if (!rateLimitResult.allowed) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
      }
    }

    let query: any = {};
    
    // For testing, if no userId, return all feedback
    if (userId && !showAll) {
      query = { studentId: userId };
    }

    // Use Mongoose model to get feedback data
    const feedbacks = await FeedbackCollection.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Transform the data to match the expected interface
    const transformedFeedbacks = feedbacks.map((feedback: any) => ({
      _id: feedback._id?.toString() || '',
      feedbackId: feedback.feedbackId,
      user: {
        _id: feedback.studentId || 'unknown',
        name: feedback.name || 'Anonymous',
        email: `${feedback.studentId || 'unknown'}@example.com`
      },
      rating: feedback.starRating || 0,
      comment: feedback.feedbackText || '',
      isAnonymous: !feedback.name,
      status: feedback.status || 'pending',
      adminComment: feedback.adminReply,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
      images: feedback.image ? [feedback.image] : [],
      category: feedback.category,
      quickRating: feedback.quickRating,
      reportIssue: feedback.reportIssue
    }));

    return NextResponse.json({ success: true, data: transformedFeedbacks });
  } catch (error: unknown) {
    console.error('Error fetching feedbacks:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/feedbacks - Create new feedback
export async function POST(req: NextRequest) {
  await connectDB();

  try {
    const userId = getUserId(req);
    const body = await req.json();

    // Extract fields from JSON body - matching the actual database schema
    const { rating, comment, isAnonymous, order, images, category, emojiRating, studentId, orderNumber, reportIssue, name } = body;

    // Validate required fields
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: 'Valid rating (1-5) is required' }, { status: 400 });
    }

    if (!comment || comment.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Comment is required' }, { status: 400 });
    }

    // Generate feedback ID
    const feedbackId = `FB${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create feedback data matching the Mongoose schema
    const feedbackData = {
      feedbackId,
      name: name || "Anonymous",
      studentId: studentId || "",
      orderReference: orderNumber || "123",
      quickRating: emojiRating || "neutral",
      starRating: rating,
      category: category || "Food",
      feedbackText: comment.trim(),
      reportIssue: reportIssue || [],
      image: images && images.length > 0 ? images[0] : null,
      adminReply: "",
      status: 'pending' as const,
    };

    // Insert using Mongoose model
    const feedback = await FeedbackCollection.create(feedbackData);

    // Create notification for admins
    try {
      const notificationData = {
        role: 'admin',
        title: 'New Feedback Submitted',
        message: `New feedback received from ${feedbackData.name} (${feedbackData.studentId}) - Rating: ${feedbackData.starRating}/5`,
        type: 'feedback',
        priority: (feedbackData.starRating || 5) <= 2 ? 'high' : 'normal',
        isRead: false,
        createdAt: new Date(),
        data: {
          feedbackId: feedbackData.feedbackId,
          studentName: feedbackData.name,
          studentId: feedbackData.studentId,
          rating: feedbackData.starRating,
          category: feedbackData.category
        }
      };
      
      // Use Mongoose for notifications if model exists, otherwise direct insert
      try {
        const NotificationModule = await import('@/lib/models/Notification');
        const NotificationModel = NotificationModule.Notification;
        await NotificationModel.create(notificationData);
      } catch {
        // Fallback to direct MongoDB if model doesn't exist
        const { MongoClient } = await import('mongodb');
        const client = new MongoClient(process.env.MONGODB_URI!);
        await client.connect();
        const db = client.db();
        await db.collection('systemnotifications').insertOne(notificationData);
        await client.close();
      }
      
      // Emit WebSocket notification to admins
      try {
        await pusherServer.trigger('admin', 'feedback_notification', {
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          priority: notificationData.priority,
          data: notificationData.data,
          timestamp: notificationData.createdAt
        });
      } catch (wsError) {
        // WebSocket notification failed, but don't fail the request
      }
    } catch (notificationError) {
      // Don't fail the request if notification fails
    }

    return NextResponse.json({ success: true, data: feedbackData }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating feedback:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTO-ANALYSIS HELPER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Trigger AI analysis for newly submitted feedback
 * Runs asynchronously without blocking user response
 */
async function triggerAutoAnalysis(
  feedbackId: string,
  feedbackText: string,
  starRating: number,
  category: string
): Promise<void> {
  try {
    

    // Determine if it's peak time
    const now = new Date();
    const hour = now.getHours();
    const isPeak = (hour >= 12 && hour < 14) || (hour >= 18 && hour < 20);

    // Run AI analysis
    const analysis = await feedbackIntelligenceService.analyze(
      feedbackText,
      starRating,
      {
        page: category?.toLowerCase(),
        time: isPeak ? 'peak' : 'non-peak'
      }
    );

    // Store classification (disabled for now)
    // await FeedbackClassification.create({
    //   feedbackId,
    //   overallSentiment: analysis.overallSentiment,
    //   userIntent: analysis.userIntent,
    //   emotionalIntensity: analysis.emotionalIntensity,
    //   keyInsight: analysis.keyInsight,
    //   operationalImpact: analysis.operationalImpact,
    //   priorityLevel: analysis.priorityLevel,
    //   recommendedAction: analysis.recommendedAction,
    //   suggestedResponse: analysis.suggestedResponse,
    //   tags: analysis.tags,
    //   context: {
    //     page: category?.toLowerCase(),
    //     time: isPeak ? 'peak' : 'non-peak'
    //   },
    //   adminReviewed: false
    // });

    console.log('[FeedbackAutoAnalysis] ✅ Analysis complete:', {
      sentiment: analysis.overallSentiment,
      priority: analysis.priorityLevel
    });

  } catch (error) {
    console.error('[FeedbackAutoAnalysis] ❌ Error:', error);
    throw error;
  }
}


