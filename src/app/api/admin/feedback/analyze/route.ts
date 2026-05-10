import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Feedback from '@/models/feedback';
import FeedbackClassification from '@/models/feedback-classification.model';
import { feedbackIntelligenceService } from '@/lib/ai/feedback-intelligence.service';
import { feedbackReplyGenerator } from '@/lib/ai/feedback-reply-generator.service';
import { isAutoReplyEligible } from '@/lib/ai/reply-safety-classifier';
import { parseCookies, verifyToken } from '@/lib/auth';
import mongoose from 'mongoose';

/**
 * POST /api/admin/feedback/analyze
 * 
 * Trigger AI analysis for a specific feedback
 * Admin-only endpoint
 */
export async function POST(req: NextRequest) {
    try {
        // ═══════════════════════════════════════════════════════════════════
        // AUTHENTICATION & AUTHORIZATION
        // ═══════════════════════════════════════════════════════════════════

        const cookieHeader = req.headers.get('cookie');
        const cookies = parseCookies(cookieHeader);
        const token = cookies['auth_token'];
        const payload = token ? verifyToken(token) : null;

        if (!payload?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Verify admin role (if role is stored in token)
        if (payload.role && payload.role !== 'admin') {
            return NextResponse.json(
                { error: 'Forbidden: Admin access required' },
                { status: 403 }
            );
        }

        // ═══════════════════════════════════════════════════════════════════
        // VALIDATE REQUEST
        // ═══════════════════════════════════════════════════════════════════

        await connectToDatabase();

        const body = await req.json().catch(() => ({}));
        const { feedbackId } = body;

        if (!feedbackId || !mongoose.Types.ObjectId.isValid(feedbackId)) {
            return NextResponse.json(
                { error: 'Invalid feedbackId' },
                { status: 400 }
            );
        }

        // ═══════════════════════════════════════════════════════════════════
        // FETCH FEEDBACK
        // ═══════════════════════════════════════════════════════════════════

        const feedback = await Feedback.findById(feedbackId);

        if (!feedback) {
            return NextResponse.json(
                { error: 'Feedback not found' },
                { status: 404 }
            );
        }

        // ═══════════════════════════════════════════════════════════════════
        // AI ANALYSIS
        // ═══════════════════════════════════════════════════════════════════

        console.log('[FeedbackAnalyze] Analyzing feedback:', feedbackId);

        const analysis = await feedbackIntelligenceService.analyze(
            feedback.feedbackText,
            feedback.starRating,
            {
                page: feedback.category?.toLowerCase(),
                orderReference: feedback.orderReference,
                // Determine time based on creation time (simple heuristic)
                time: isPeakTime(new Date(feedback.createdAt)) ? 'peak' : 'non-peak'
            }
        );

        console.log('[FeedbackAnalyze] Analysis complete:', {
            sentiment: analysis.overallSentiment,
            priority: analysis.priorityLevel,
            impact: analysis.operationalImpact
        });

        // ═══════════════════════════════════════════════════════════════════
        // AI REPLY GENERATION
        // ═══════════════════════════════════════════════════════════════════

        console.log('[FeedbackAnalyze] Generating AI reply...');

        const replyResult = await feedbackReplyGenerator.generateReply(
            feedback.feedbackText,
            analysis
        );

        // Determine safety classification
        const safetyClassification = isAutoReplyEligible(analysis, feedback.feedbackText);

        console.log('[FeedbackAnalyze] Reply generated:', {
            escalate: replyResult.escalate,
            autoReplyEligible: safetyClassification.autoReplyEligible,
            riskLevel: safetyClassification.riskLevel
        });

        // Determine reply status
        let replyStatus: 'pending_review' | 'auto_sent' | 'escalated' | 'none';

        if (replyResult.escalate) {
            replyStatus = 'escalated';
        } else if (safetyClassification.autoReplyEligible) {
            replyStatus = 'auto_sent';
        } else {
            replyStatus = 'pending_review';
        }

        // ═══════════════════════════════════════════════════════════════════
        // STORE CLASSIFICATION
        // ═══════════════════════════════════════════════════════════════════

        // Check if classification already exists
        const existingClassification = await FeedbackClassification.findOne({
            feedbackId: feedback._id
        });

        let classification;

        if (existingClassification) {
            // Update existing classification
            classification = await FeedbackClassification.findOneAndUpdate(
                { feedbackId: feedback._id },
                {
                    overallSentiment: analysis.overallSentiment,
                    userIntent: analysis.userIntent,
                    emotionalIntensity: analysis.emotionalIntensity,
                    keyInsight: analysis.keyInsight,
                    operationalImpact: analysis.operationalImpact,
                    priorityLevel: analysis.priorityLevel,
                    recommendedAction: analysis.recommendedAction,
                    suggestedResponse: analysis.suggestedResponse,
                    tags: analysis.tags,
                    context: {
                        page: feedback.category?.toLowerCase(),
                        orderReference: feedback.orderReference,
                        time: isPeakTime(new Date(feedback.createdAt)) ? 'peak' : 'non-peak'
                    }
                },
                { new: true }
            );
        } else {
            // Create new classification
            classification = await FeedbackClassification.create({
                feedbackId: feedback._id,
                overallSentiment: analysis.overallSentiment,
                userIntent: analysis.userIntent,
                emotionalIntensity: analysis.emotionalIntensity,
                keyInsight: analysis.keyInsight,
                operationalImpact: analysis.operationalImpact,
                priorityLevel: analysis.priorityLevel,
                recommendedAction: analysis.recommendedAction,
                suggestedResponse: analysis.suggestedResponse,
                tags: analysis.tags,
                context: {
                    page: feedback.category?.toLowerCase(),
                    orderReference: feedback.orderReference,
                    time: isPeakTime(new Date(feedback.createdAt)) ? 'peak' : 'non-peak'
                },
                adminReviewed: false
            });
        }

        console.log('[FeedbackAnalyze] ✅ Classification stored');

        // ═══════════════════════════════════════════════════════════════════
        // RETURN RESULT
        // ═══════════════════════════════════════════════════════════════════

        return NextResponse.json({
            success: true,
            data: {
                feedback,
                classification,
                analysis
            }
        }, { status: 200 });

    } catch (error) {
        console.error('[FeedbackAnalyze] ❌ Error:', error);

        return NextResponse.json(
            {
                error: 'Failed to analyze feedback',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * Helper: Determine if time is peak hour
 * Peak hours: 12:00-14:00 (lunch) and 18:00-20:00 (dinner)
 */
function isPeakTime(date: Date): boolean {
    const hour = date.getHours();
    return (hour >= 12 && hour < 14) || (hour >= 18 && hour < 20);
}
