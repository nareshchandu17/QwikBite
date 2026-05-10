import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Feedback from '@/lib/models/Feedback';
import { feedbackIntelligenceService } from '@/lib/ai/feedback-intelligence.service';
import { verifyToken, parseCookies } from '@/lib/auth';
import { Types } from 'mongoose';
import { socketManager } from '@/lib/websocket/server';
import { MongoClient } from 'mongodb';

export const dynamic = 'force-dynamic';

interface IFeedbackDocument {
  _id: Types.ObjectId;
  feedbackId?: string;
  studentId?: string;
  name?: string;
  starRating?: number;
  feedbackText?: string;
  adminReply?: string;
  createdAt?: Date;
  updatedAt?: Date;
  image?: string;
  category?: string;
  quickRating?: string;
  reportIssue?: string[];
}

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

    // If authenticated, return user's feedback; otherwise return all
    // DEBUG: Allow bypassing filter with ?all=true
    const url = new URL(req.url);
    const showAll = url.searchParams.get('all') === 'true';

    let query = {};
    
    // For testing, if no userId, return all feedback
    if (userId && !showAll) {
      query = { studentId: userId };
    }

    console.log('[DEBUG] Query:', query);
    console.log('[DEBUG] UserId:', userId);

    // Use the raw MongoDB collection to get the actual feedback data
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db();
    
    const feedbacks = await db.collection('feedbacks')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    await client.close();

    console.log('[DEBUG] Found feedbacks:', feedbacks.length);

    // Transform the data to match the expected interface
    const transformedFeedbacks = (feedbacks as unknown as IFeedbackDocument[]).map((feedback) => ({
      _id: feedback._id.toString(),
      feedbackId: feedback.feedbackId, // Include the actual feedbackId
      user: {
        _id: feedback.studentId || 'unknown',
        name: feedback.name || 'Anonymous',
        email: `${feedback.studentId || 'unknown'}@example.com`
      },
      rating: feedback.starRating || 0,
      comment: feedback.feedbackText || '',
      isAnonymous: !feedback.name,
      status: 'approved', // Default status since it's not in the schema
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

    console.log('[DEBUG] POST body:', body);
    console.log('[DEBUG] UserId:', userId);

    // Extract fields from JSON body - matching the actual database schema
    const { rating, comment, isAnonymous, order, images, category, emojiRating, studentId, orderNumber, reportIssue, name } = body;

    // Validate required fields
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: 'Valid rating (1-5) is required' }, { status: 400 });
    }

    if (!comment || comment.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Comment is required' }, { status: 400 });
    }

    // Create feedback data matching the actual database schema
    const feedbackData: IFeedbackDocument & Record<string, unknown> = {
      _id: new Types.ObjectId(),
      name: name || "Anonymous",
      studentId: studentId || "",
      orderReference: orderNumber || "123", // Default order reference
      quickRating: emojiRating || "neutral",
      starRating: rating,
      category: category || "Food",
      feedbackText: comment.trim(),
      reportIssue: reportIssue || [],
      image: images && images.length > 0 ? images[0] : null,
      adminReply: "",
    };

    console.log('[DEBUG] Creating feedback with data:', feedbackData);

    // Insert directly into MongoDB collection
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db();
    
    // Generate feedback ID
    const feedbackId = `FB${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    feedbackData.feedbackId = feedbackId;
    feedbackData.createdAt = new Date();
    feedbackData.updatedAt = new Date();
    
    const result = await db.collection('feedbacks').insertOne(feedbackData);
    await client.close();

    console.log('[DEBUG] Created feedback:', result);

    // Create notification for admins
    try {
      const client = new MongoClient(process.env.MONGODB_URI!);
      await client.connect();
      const db = client.db();
      
      // Create system notification for admins
      const notificationData = {
        role: 'admin',
        title: 'New Feedback Submitted',
        message: `New feedback received from ${feedbackData.name} (${feedbackData.studentId}) - Rating: ${feedbackData.starRating}/5`,
        type: 'feedback',
        priority: feedbackData.starRating <= 2 ? 'high' : 'normal',
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
      
      await db.collection('systemnotifications').insertOne(notificationData);
      await client.close();
      
      console.log('[DEBUG] Admin notification created:', notificationData);
      
      // Emit WebSocket notification to admins
      try {
        socketManager.emitToAll('feedback_notification', {
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          priority: notificationData.priority,
          data: notificationData.data,
          timestamp: notificationData.createdAt
        });
        console.log('[DEBUG] WebSocket notification sent to admins');
      } catch (wsError) {
        console.error('[DEBUG] Failed to send WebSocket notification:', wsError);
      }
    } catch (notificationError) {
      console.error('[DEBUG] Failed to create admin notification:', notificationError);
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
    console.log('[FeedbackAutoAnalysis] Starting analysis for:', feedbackId);

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
