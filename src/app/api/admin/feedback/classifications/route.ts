import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Feedback from '@/models/feedback';
import FeedbackClassification from '@/models/feedback-classification.model';
import { parseCookies, verifyToken } from '@/lib/auth';

/**
 * GET /api/admin/feedback/classifications
 * 
 * Fetch feedbacks with AI classifications for admin panel
 * Supports filtering by priority, sentiment, impact, and search
 */
export async function GET(req: NextRequest) {
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

        // Verify admin role
        if (payload.role && payload.role !== 'admin') {
            return NextResponse.json(
                { error: 'Forbidden: Admin access required' },
                { status: 403 }
            );
        }

        // ═══════════════════════════════════════════════════════════════════
        // PARSE QUERY PARAMETERS
        // ═══════════════════════════════════════════════════════════════════

        await connectToDatabase();

        const url = new URL(req.url);

        // Filtering
        const priority = url.searchParams.get('priority');
        const sentiment = url.searchParams.get('sentiment');
        const impact = url.searchParams.get('impact');
        const reviewed = url.searchParams.get('reviewed');
        const search = url.searchParams.get('search');

        // Pagination
        const page = Number(url.searchParams.get('page') || '1');
        const limit = Math.min(Number(url.searchParams.get('limit') || '50'), 200);
        const skip = (page - 1) * limit;

        // ═══════════════════════════════════════════════════════════════════
        // BUILD CLASSIFICATION FILTER
        // ═══════════════════════════════════════════════════════════════════

        const classificationFilter: Record<string, unknown> = {};

        if (priority) {
            classificationFilter.priorityLevel = priority;
        }

        if (sentiment) {
            classificationFilter.overallSentiment = sentiment;
        }

        if (impact) {
            classificationFilter.operationalImpact = impact;
        }

        if (reviewed === 'true') {
            classificationFilter.adminReviewed = true;
        } else if (reviewed === 'false') {
            classificationFilter.adminReviewed = false;
        }

        // ═══════════════════════════════════════════════════════════════════
        // FETCH CLASSIFICATIONS
        // ═══════════════════════════════════════════════════════════════════

        const classifications = await FeedbackClassification.find(classificationFilter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Extract feedback IDs
        const feedbackIds = classifications.map(c => c.feedbackId);

        // ═══════════════════════════════════════════════════════════════════
        // FETCH CORRESPONDING FEEDBACKS
        // ═══════════════════════════════════════════════════════════════════

        const feedbackFilter: Record<string, unknown> = {
            _id: { $in: feedbackIds }
        };

        // Search filter (if provided)
        if (search && search.trim()) {
            feedbackFilter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { studentId: { $regex: search, $options: 'i' } },
                { feedbackText: { $regex: search, $options: 'i' } },
                { orderReference: { $regex: search, $options: 'i' } }
            ];
        }

        const feedbacks = await Feedback.find(feedbackFilter).lean();

        // ═══════════════════════════════════════════════════════════════════
        // MERGE FEEDBACK + CLASSIFICATION
        // ═══════════════════════════════════════════════════════════════════

        const feedbackMap = new Map(
            feedbacks.map(f => [String(f._id), f])
        );

        const results = classifications
            .map(classification => {
                const feedback = feedbackMap.get(classification.feedbackId.toString());
                if (!feedback) return null;

                return {
                    ...feedback,
                    classification
                };
            })
            .filter(Boolean);

        // ═══════════════════════════════════════════════════════════════════
        // CALCULATE STATS
        // ═══════════════════════════════════════════════════════════════════

        const totalCount = await FeedbackClassification.countDocuments(classificationFilter);

        // Aggregate stats
        const stats = await FeedbackClassification.aggregate([
            { $match: classificationFilter },
            {
                $group: {
                    _id: null,
                    totalFeedbacks: { $sum: 1 },
                    urgentCount: {
                        $sum: { $cond: [{ $eq: ['$priorityLevel', 'Urgent'] }, 1, 0] }
                    },
                    needsAttentionCount: {
                        $sum: { $cond: [{ $eq: ['$priorityLevel', 'Needs Attention'] }, 1, 0] }
                    },
                    monitorCount: {
                        $sum: { $cond: [{ $eq: ['$priorityLevel', 'Monitor'] }, 1, 0] }
                    },
                    informationalCount: {
                        $sum: { $cond: [{ $eq: ['$priorityLevel', 'Informational'] }, 1, 0] }
                    },
                    positiveCount: {
                        $sum: { $cond: [{ $eq: ['$overallSentiment', 'Positive'] }, 1, 0] }
                    },
                    mixedCount: {
                        $sum: { $cond: [{ $eq: ['$overallSentiment', 'Mixed'] }, 1, 0] }
                    },
                    negativeCount: {
                        $sum: { $cond: [{ $eq: ['$overallSentiment', 'Negative'] }, 1, 0] }
                    },
                    neutralCount: {
                        $sum: { $cond: [{ $eq: ['$overallSentiment', 'Neutral'] }, 1, 0] }
                    },
                    highImpactCount: {
                        $sum: { $cond: [{ $eq: ['$operationalImpact', 'High'] }, 1, 0] }
                    }
                }
            }
        ]);

        // ═══════════════════════════════════════════════════════════════════
        // RETURN RESPONSE
        // ═══════════════════════════════════════════════════════════════════

        return NextResponse.json({
            success: true,
            data: results,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit)
            },
            stats: stats[0] || {
                totalFeedbacks: 0,
                urgentCount: 0,
                needsAttentionCount: 0,
                monitorCount: 0,
                informationalCount: 0,
                positiveCount: 0,
                mixedCount: 0,
                negativeCount: 0,
                neutralCount: 0,
                highImpactCount: 0
            }
        }, { status: 200 });

    } catch (error) {
        console.error('[FeedbackClassifications] ❌ Error:', error);

        return NextResponse.json(
            {
                error: 'Failed to fetch feedback classifications',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
