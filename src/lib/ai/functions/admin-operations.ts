import { ComplaintClassification, EnrichedContext } from '../types';
import { connectDB } from '@/lib/db';
import Feedback from '@/models/feedback';
import { openRouterClient } from '../openrouter-client';

/**
 * Classify complaint using AI (Admin function)
 */
export async function classifyComplaint(
    params: {
        feedbackId: string;
    },
    context: EnrichedContext
): Promise<ComplaintClassification> {
    await connectDB();

    // Verify admin role
    if (context.userState.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
    }

    const feedback = await Feedback.findById(params.feedbackId).lean();

    if (!feedback) {
        throw new Error('Feedback not found');
    }

    // Use AI to classify
    const classification = await openRouterClient.classifyFeedback(
        (feedback as { feedbackText?: string }).feedbackText || '',
        (feedback as { starRating?: number }).starRating || 3
    );

    // Store classification in feedback meta
    await Feedback.findByIdAndUpdate(params.feedbackId, {
        $set: {
            'meta.aiClassification': classification,
            'meta.classifiedAt': new Date()
        }
    });

    return classification as ComplaintClassification;
}

/**
 * Get feedback analytics (Admin function)
 */
export async function getFeedbackAnalytics(
    params: {
        startDate?: Date;
        endDate?: Date;
    },
    context: EnrichedContext
): Promise<{
    total: number;
    byRating: Record<number, number>;
    bySentiment: Record<string, number>;
    averageRating: number;
}> {
    await connectDB();

    // Verify admin role
    if (context.userState.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
    }

    const query: Record<string, unknown> = {};
    if (params.startDate || params.endDate) {
        const dateQuery: { $gte?: Date; $lte?: Date } = {};
        if (params.startDate) dateQuery.$gte = params.startDate;
        if (params.endDate) dateQuery.$lte = params.endDate;
        query.createdAt = dateQuery;
    }

    const feedbacks = await Feedback.find(query).lean();

    const byRating: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const bySentiment: Record<string, number> = { positive: 0, neutral: 0, negative: 0 };
    let totalRating = 0;

    feedbacks.forEach(fb => {
        byRating[fb.starRating] = (byRating[fb.starRating] || 0) + 1;
        totalRating += fb.starRating;

        // Infer sentiment from rating if not classified
        const sentiment = fb.starRating >= 4 ? 'positive' : fb.starRating === 3 ? 'neutral' : 'negative';
        bySentiment[sentiment] = (bySentiment[sentiment] || 0) + 1;
    });

    return {
        total: feedbacks.length,
        byRating,
        bySentiment,
        averageRating: feedbacks.length > 0 ? totalRating / feedbacks.length : 0
    };
}

/**
 * Respond to feedback (Admin function)
 */
export async function respondToFeedback(
    params: {
        feedbackId: string;
        response: string;
    },
    context: EnrichedContext
): Promise<{ success: boolean; message: string }> {
    await connectDB();

    // Verify admin role
    if (context.userState.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
    }

    const feedback = await Feedback.findByIdAndUpdate(
        params.feedbackId,
        {
            $set: {
                adminReply: params.response,
                'meta.respondedAt': new Date(),
                'meta.respondedBy': context.userState.userId
            }
        },
        { new: true }
    );

    if (!feedback) {
        throw new Error('Feedback not found');
    }

    return {
        success: true,
        message: 'Response sent successfully'
    };
}
